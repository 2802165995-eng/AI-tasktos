export function buildAnalyzeReferencePayload(reference) {
  const payload = {
    id: reference.id
  };

  const title = String(reference.title || "").trim();
  const userNote = String(reference.userNote || "").trim();
  if (title) payload.title = title;
  if (reference.category) payload.category = reference.category;
  if (userNote) payload.userNote = userNote;

  if (reference.imageBase64) {
    payload.imageBase64 = reference.imageBase64;
  } else if (reference.imageUrl) {
    payload.imageUrl = reference.imageUrl;
  }

  return payload;
}

export async function analyzeReferenceViaApi(reference, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const response = await fetchImpl("/api/analyze-reference", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(buildAnalyzeReferencePayload(reference))
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `Analyze reference failed with status ${response.status}`);
  }

  if (!body.analysis) {
    throw new Error("Analyze reference response is missing analysis");
  }

  return body.analysis;
}
