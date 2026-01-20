export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  // Salli GET-pyyntö testaukseen
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "OK", message: "Oivalluta API toimii. Käytä POST-pyyntöä." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Estä muut metodit
  if (req.method !== "POST") {
    return new Response("Only POST allowed", { status: 405 });
  }

  try {
    const { text, tone } = await req.json();

    const SYSTEM_PROMPT = `
Toimit Tilastokeskuksen viestinnän apurina.

Muokkaa käyttäjän antama teksti Tilastokeskuksen äänensävyn mukaiseksi.
Äänensävyt ovat:

- Oivalluttava: auttaa ymmärtämään, selittää ja tuo esiin havaintoja.
- Virkeä: raikas, energinen ja helposti lähestyttävä.
- Asiantunteva: täsmällinen, luotettava ja rauhallinen.
- Palveleva: ystävällinen, selkeä ja käyttäjää auttava.

Käyttäjä valitsee yhden näistä tai yhdistelmän.
Säilytä faktat ja ydinviesti. Kirjoita suomeksi.
`;

    const payload = {
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
        { role: "user", content: `Äänensävy: ${tone}` }
      ]
    };

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await openaiRes.json();

    // Poimi teksti uuden Responses API:n rakenteesta
    const outputText =
      data?.output?.[0]?.content?.[0]?.text?.trim() ||
      "Ei saatu vastausta OpenAI:lta.";

    return new Response(
      JSON.stringify({ text: outputText }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Virhe palvelussa", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
