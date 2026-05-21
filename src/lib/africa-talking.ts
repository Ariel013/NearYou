const API_KEY = process.env.AFRICA_TALKING_API_KEY;
const USERNAME = process.env.AFRICA_TALKING_USERNAME;
const IS_PLACEHOLDER =
  !API_KEY || API_KEY === "PLACEHOLDER_A_RENSEIGNER";

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (IS_PLACEHOLDER) {
    console.log(`[DEV OTP] Phone: ${phone} — Code: ${code}`);
    return;
  }

  const res = await fetch(
    "https://api.africastalking.com/version1/messaging",
    {
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
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Africa's Talking error: ${res.status} — ${body}`);
  }
}
