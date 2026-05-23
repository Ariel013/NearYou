const API_KEY  = process.env.AFRICA_TALKING_API_KEY;
const USERNAME = process.env.AFRICA_TALKING_USERNAME;
const DEBUG_OTP = process.env.DEBUG_OTP === "true";

const IS_PLACEHOLDER = !API_KEY || API_KEY === "PLACEHOLDER_A_RENSEIGNER";

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  // Mode dev / placeholder : log le code en clair dans les fonctions Vercel
  if (IS_PLACEHOLDER || DEBUG_OTP) {
    console.log(`[OTP] ${phone} → ${code}`);
    return;
  }

  const isSandbox = USERNAME === "sandbox";
  const url = isSandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apiKey: API_KEY!,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      username: USERNAME!,
      to: phone,
      message: `Votre code GéoService : ${code}. Valable 10 minutes.`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Africa's Talking] ${res.status} — ${body}`);
    throw new Error(`SMS non envoyé (${res.status})`);
  }
}
