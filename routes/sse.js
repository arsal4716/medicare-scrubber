// routes/sse.js
let clients = [];

function eventsHandler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };
  clients.push(newClient);
 
  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
}

function sendEventsToAll(progressData) {
  clients.forEach(client =>
    client.res.write(`data: ${JSON.stringify(progressData)}\n\n`)
  );
}

module.exports = { eventsHandler, sendEventsToAll };
