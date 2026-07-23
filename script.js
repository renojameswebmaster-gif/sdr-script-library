const form = document.getElementById('address-form');
const addressInput = document.getElementById('address');
const status = document.getElementById('status');
const result = document.getElementById('result');

const zoneMap = {
  'America/Los_Angeles': {
    title: 'Pacific time',
    theme: 'pacific',
    label: 'Pacific Time',
    detail: 'UTC−8 / UTC−7 during daylight saving',
  },
  'America/Denver': {
    title: 'Mountain time',
    theme: 'mountain',
    label: 'Mountain Time',
    detail: 'UTC−7 / UTC−6 during daylight saving',
  },
  'America/Chicago': {
    title: 'Central time',
    theme: 'central',
    label: 'Central Time',
    detail: 'UTC−6 / UTC−5 during daylight saving',
  },
  'America/New_York': {
    title: 'Eastern time',
    theme: 'eastern',
    label: 'Eastern Time',
    detail: 'UTC−5 / UTC−4 during daylight saving',
  },
};

function showMessage(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#b91c1c' : '#475569';
}

function formatZoneTime(timezone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).formatToParts(now);

  const hour = parts.find((part) => part.type === 'hour')?.value || '';
  const minute = parts.find((part) => part.type === 'minute')?.value || '';
  const ampm = parts.find((part) => part.type === 'dayPeriod')?.value || '';
  const weekday = parts.find((part) => part.type === 'weekday')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';

  return {
    time: `${hour}:${minute}`,
    ampm,
    date: `${weekday} ${month} ${day}`,
  };
}

function buildZoneCard(zone) {
  const zoneTime = formatZoneTime(zone.timezone);
  return `
    <article class="zone-card ${zone.theme}">
      <div class="card-header">
        <span>${zone.title}</span>
      </div>
      <div class="card-body">
        <p class="zone-clock">${zoneTime.time}<span class="zone-ampm">${zoneTime.ampm}</span></p>
        <p class="zone-date">${zoneTime.date}</p>
      </div>
      <div class="card-footer">Current local time</div>
    </article>
  `;
}

function displayResult({ label, detail, timezone, placeName, coordinates }) {
  const zone = zoneMap[timezone] || {
    title: timezone,
    theme: 'default',
  };
  const card = buildZoneCard({ ...zone, timezone });

  result.classList.remove('hidden', 'error');
  result.innerHTML = `
    <div class="result-row">
      ${card}
    </div>
    <div class="result-summary">
      <p class="result-summary-title">Detected timezone: <strong>${label}</strong></p>
      <p class="result-summary-detail">${detail}</p>
      <p class="result-summary-meta">Location: ${placeName} • Coordinates: ${coordinates}</p>
    </div>
  `;
}

function displayError(message) {
  result.classList.remove('hidden');
  result.classList.add('error');
  result.innerHTML = `
    <div class="result-summary">
      <p class="result-summary-title">Unable to determine timezone</p>
      <p class="result-summary-detail">${message}</p>
    </div>
  `;
}

async function lookupAddress(address) {
  showMessage('Looking up the address...');
  result.classList.add('hidden');

  const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;
  const geocodeResponse = await fetch(geocodeUrl, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!geocodeResponse.ok) throw new Error('The address lookup failed. Please try a different address.');

  const geocodeData = await geocodeResponse.json();
  if (!geocodeData.length) throw new Error('No matching location was found. Please try a more specific address.');

  const place = geocodeData[0];
  const lat = place.lat;
  const lon = place.lon;

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
  const weatherResponse = await fetch(weatherUrl);
  if (!weatherResponse.ok) throw new Error('The timezone lookup failed. Please try again in a moment.');

  const weatherData = await weatherResponse.json();
  const timezone = weatherData.timezone || 'Unknown';
  const matchedZone = zoneMap[timezone];

  const label = matchedZone ? matchedZone.label : `Detected IANA timezone: ${timezone}`;
  const detail = matchedZone ? matchedZone.detail : `The detected IANA timezone is ${timezone}.`;

  displayResult({
    label,
    detail,
    timezone,
    placeName: place.display_name,
    coordinates: `${lat}, ${lon}`,
  });

  showMessage('Done.');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const address = addressInput.value.trim();

  if (!address) {
    displayError('Please enter an address.');
    showMessage('Please enter an address.', true);
    return;
  }

  try {
    await lookupAddress(address);
  } catch (error) {
    displayError(error.message);
    showMessage(error.message, true);
  }
});
