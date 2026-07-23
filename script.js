const form = document.getElementById('address-form');
const addressInput = document.getElementById('address');
const status = document.getElementById('status');
const result = document.getElementById('result');

const zoneMap = {
  'America/Los_Angeles': { label: 'Pacific Time', detail: 'UTC−8 / UTC−7 during daylight saving' },
  'America/Denver': { label: 'Mountain Time', detail: 'UTC−7 / UTC−6 during daylight saving' },
  'America/Chicago': { label: 'Central Time', detail: 'UTC−6 / UTC−5 during daylight saving' },
  'America/New_York': { label: 'Eastern Time', detail: 'UTC−5 / UTC−4 during daylight saving' },
  'America/Phoenix': { label: 'Mountain Standard Time', detail: 'Arizona does not observe daylight saving' },
  'America/Boise': { label: 'Mountain Time', detail: 'Mountain Time' },
  'America/Detroit': { label: 'Eastern Time', detail: 'Eastern Time' },
  'America/Indianapolis': { label: 'Eastern Time', detail: 'Eastern Time' },
  'America/Anchorage': { label: 'Alaska Time', detail: 'Alaska Time' },
  'Pacific/Honolulu': { label: 'Hawaii Time', detail: 'Hawaii Time' },
};

function showMessage(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#b91c1c' : '#475569';
}

function displayResult({ label, detail, timezone, localTime, placeName, coordinates }) {
  result.classList.remove('hidden', 'error');
  result.innerHTML = `
    <h2>${label}</h2>
    <p class="meta"><strong>Detected timezone:</strong> ${timezone}</p>
    <p class="meta"><strong>Location:</strong> ${placeName}</p>
    <p class="meta"><strong>Coordinates:</strong> ${coordinates}</p>
    <p class="meta"><strong>Current local time:</strong> ${localTime}</p>
    <p class="meta">${detail}</p>
  `;
}

function displayError(message) {
  result.classList.remove('hidden');
  result.classList.add('error');
  result.innerHTML = `
    <h2>Could not determine the time zone</h2>
    <p class="meta">${message}</p>
  `;
}

async function lookupAddress(address) {
  showMessage('Looking up the address...');
  result.classList.add('hidden');

  const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`;

  const geocodeResponse = await fetch(geocodeUrl, {
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en'
    }
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

  const label = matchedZone ? matchedZone.label : 'Outside the four main U.S. time zones';
  const detail = matchedZone ? matchedZone.detail : `The detected IANA timezone is ${timezone}.`;

  const localTime = new Date().toLocaleString('en-US', {
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'long'
  });

  displayResult({
    label,
    detail,
    timezone,
    localTime,
    placeName: place.display_name,
    coordinates: `${lat}, ${lon}`
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
