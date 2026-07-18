// api/save-lead.js
// Vercel Serverless Function — proxy seguro entre el cotizador y el Apps Script del CRM.
// El secreto vive en variables de entorno de Vercel; nunca llega al navegador.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const WEBHOOK_URL = process.env.LUMO_CRM_WEBHOOK_URL;
  const SECRET = process.env.LUMO_CRM_SECRET;

  if (!WEBHOOK_URL || !SECRET) {
    return res.status(500).json({
      ok: false,
      error: "Faltan variables de entorno LUMO_CRM_WEBHOOK_URL o LUMO_CRM_SECRET en Vercel.",
    });
  }

  try {
    const lead = req.body && (req.body.lead || req.body);
    if (!lead || !lead.nombre || !lead.destino) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos obligatorios: nombre y/o destino.",
      });
    }

    const upstream = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: SECRET, lead }),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: "Respuesta no-JSON del Apps Script", raw: text.slice(0, 500) };
    }

    return res.status(upstream.ok ? 200 : upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
