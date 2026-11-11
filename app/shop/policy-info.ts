export type PolicyKey = "RETURN" | "REPLACE" | "REFUND";

// PLACEHOLDER TEXT: replace with your real policies
export const POLICY_INFO: Record<
  PolicyKey,
  { title: string; intro: string; points: string[] }
> = {
  RETURN: {
    title: "Return policy",
    intro:
      "If the product you received is not right, you can send it back within the return window after delivery.",
    points: [
      "Request a return from the Order Details page once the order is delivered.",
      "The item must be unused, in its original packaging, with all tags and accessories.",
      "Share photos or a short video of the product as proof.",
      "After the store approves, the item is picked up or you ship it back.",
      "Customised or personalised items cannot be returned.",
    ],
  },
  REPLACE: {
    title: "Replacement policy",
    intro:
      "If the item is damaged, defective or wrong, you can ask for a replacement within the replacement window.",
    points: [
      "Request a replacement from the Order Details page once the order is delivered.",
      "Share clear photos or a video showing the damage or defect.",
      "A replacement is sent only if the same item is in stock.",
      "If it is out of stock, the store may offer a refund instead.",
      "The original item must be handed back when the replacement is delivered.",
    ],
  },
  REFUND: {
    title: "Refund policy",
    intro:
      "Refunds are available only for eligible products, and only for online payments that were completed.",
    points: [
      "Approved refunds are sent to your bank account or UPI ID, which you provide in the request.",
      "Refunds usually take 5 to 7 working days after approval.",
      "Cash on Delivery orders are refunded by bank transfer or UPI only.",
      "Shipping charges are not refunded unless the store made the error.",
      "For services, refund rules depend on how early you cancel before the booking date.",
    ],
  },
};
export const POLICY_KEY: Record<string, PolicyKey | undefined> = {
  Return: "RETURN",
  Replacement: "REPLACE",
  Refund: "REFUND",
};