import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  
  // În producție, aici se va folosi stripe.webhooks.constructEvent
  // pentru a verifica semnătura webhook-ului.
  
  try {
    const event = JSON.parse(body);
    
    // Verificăm tipul evenimentului
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      // Extragem datele personalizate din metadata (trimise anterior la crearea sesiunii)
      const { childName, childAge, storyTheme, storyLesson } = session.metadata;
      const customerEmail = session.customer_details.email;

      console.log("Plată confirmată pentru:", childName);

      // AICI: Trimite datele către n8n sau alt serviciu de backend pentru generarea poveștii
      // fetch('WEBHOOK_N8N_URL', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     email: customerEmail,
      //     name: childName,
      //     age: childAge,
      //     theme: storyTheme,
      //     lesson: storyLesson,
      //     orderId: session.id
      //   })
      // });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
