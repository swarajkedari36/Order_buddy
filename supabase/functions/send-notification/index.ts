import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  to: string;
  customerName: string;
  orderId: string;
  orderAmount: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Notification request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, customerName, orderId, orderAmount }: NotificationRequest = await req.json();

    console.log(`Sending notification email to ${to} for order ${orderId}`);

    const emailResponse = await resend.emails.send({
      from: "Order Buddy <onboarding@resend.dev>",
      to: [to],
      subject: `New Order Confirmation - ${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Order Buddy</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Order Management System</p>
          </div>
          
          <h2 style="color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Order Confirmation</h2>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Hello <strong>${customerName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Your order has been successfully created and is now being processed. Here are the details:
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Order ID:</td>
                <td style="padding: 8px 0; color: #666;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Customer Name:</td>
                <td style="padding: 8px 0; color: #666;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Order Amount:</td>
                <td style="padding: 8px 0; color: #666; font-weight: bold; font-size: 18px;">₹${orderAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Status:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: #fbbf24; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold;">PENDING</span>
                </td>
              </tr>
            </table>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We will keep you updated on the progress of your order. If you have any questions or concerns, please don't hesitate to contact us.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Thank you for choosing Order Buddy!
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);