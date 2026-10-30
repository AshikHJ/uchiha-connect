import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[UCHIHA CONNECT API Server] Listening on http://localhost:${PORT}`);
});
