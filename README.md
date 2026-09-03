# SDR Script Library

A professional, responsive static website for SDR cold-call scripts. It supports instant search, accordion navigation, favorites, copy-to-clipboard, dark mode, and recent script tracking.

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root:
   - index.html
   - styles.css
   - script.js
   - scripts.json
3. Open the repository in GitHub and go to Settings → Pages.
4. Under Source, choose Deploy from a branch.
5. Select the main branch and save.
6. GitHub Pages will provide a public URL for your site.

## Local preview

Open index.html in a browser, or run a simple local server from the project folder:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

## Public AI search assistant

The website includes a public "Ask AI" assistant that uses OpenAI web search. The browser never receives the OpenAI API key. Deploy the `server` directory as a Node service, set `OPENAI_API_KEY` in its environment, and allow requests from `https://renojameswebmaster-gif.github.io`.

For Render, use the root `render.yaml` configuration. Set the `OPENAI_API_KEY` secret in the Render dashboard, then deploy the service at `https://sdr-script-library-api.onrender.com`. Public users are limited to 10 searches per minute per IP address.

To run the assistant locally:

```bash
cd server
npm install
copy .env.example .env
npm start
```

Set `window.SDR_CHAT_API_URL` in `index.html` to the deployed server URL if it changes.

