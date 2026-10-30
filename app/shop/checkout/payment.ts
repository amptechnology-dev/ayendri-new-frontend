export function submitPayUPayment(
  paymentUrl: string,
  payuParams: Record<string, string>,
) {
  if (!paymentUrl || !/^https?:\/\//i.test(paymentUrl)) {
    throw new Error("Invalid payment gateway URL.");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  form.style.display = "none";

  for (const [key, value] of Object.entries(payuParams)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}