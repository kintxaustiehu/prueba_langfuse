# Social Calendar — Simple web app

This is a minimal, client-side social calendar. Events are stored in `localStorage`. You can export/import events as JSON and copy a shareable link for individual events.

Run locally (simple static server):

```bash
# from project root
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Features:
- Month view calendar
- Add events (title, time, description)
- Events persisted in `localStorage`
- Export / import events as JSON
- Share event link (copies URL with event id to clipboard)

Server (multi-user)
-------------------

This project includes a minimal Node server (`server.js`) that stores users and events in `data.json`.

Start the server (Node.js required):

```bash
# from project root
node server.js
# server listens on http://localhost:3000
```

The frontend attempts to use the server at `http://localhost:3000`. If the server isn't running, the frontend will still render, but multi-user features won't work.

GitHub Actions quickstart workflow
---------------------------------

This repository includes the workflow from GitHub's quickstart guide:

- Workflow file: `.github/workflows/github-actions-demo.yml`
- Workflow name: `GitHub Actions Demo`
- Trigger: `push`

After pushing to GitHub, open the **Actions** tab in your repository to see runs.

