import nodemailer from "nodemailer";

export async function sendBookingConfirmationEmail(
  to: string,
  {
    itemName,
    start,
    end,
    bookedQuantity,
  }: {
    itemName: string;
    start: string;
    end: string;
    bookedQuantity: number;
  }
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER, // your Gmail address
      pass: process.env.GMAIL_PASS, // app password, not your main password
    },
  });

  const mailOptions = {
    from: `"Inventory IITBBS" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Booking Confirmation for ${itemName}`,
    html: `
    <head>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f0f2f5;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    }
    .banner {
      width: 100%;
      height: auto;
      display: block;
    }
    .content {
      padding: 32px 24px;
    }
    h2 {
      color: #2b2d42;
      font-size: 26px;
      margin-bottom: 20px;
    }
    p {
      color: #555;
      font-size: 16px;
      line-height: 1.6;
      margin: 12px 0;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 20px 0;
      background-color: #f7f9fb;
      border-radius: 8px;
      padding: 16px;
    }
    li {
      margin-bottom: 10px;
      font-size: 15px;
    }
    .label {
      font-weight: 600;
      color: #1a1a1a;
    }
    .footer {
      font-size: 13px;
      color: #888;
      text-align: center;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .button-group {
      margin-top: 30px;
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      margin: 6px;
      border-radius: 6px;
      font-size: 14px;
      text-decoration: none;
      color: #ffffff;
      background-color: #4e73df;
      box-shadow: 0 2px 6px rgba(78, 115, 223, 0.3);
      transition: background-color 0.3s ease;
    }
    .btn:hover {
      background-color: #2e59d9;
    }
    @media screen and (max-width: 600px) {
      .content {
        padding: 20px 16px;
      }
      h2 {
        font-size: 22px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <img
      src="https://cloud.appwrite.io/v1/storage/buckets/6702651e002bf8d7a567/files/6704c508000d4a77fb52/view?project=67025fda0015f268c129"
      alt="Booking Confirmation"
      class="banner"
    />
    <div class="content">
      <h2>📦 Booking Request Submitted</h2>
      <p>Hello,</p>
      <p>Your booking request for <strong>${itemName}</strong> has been submitted successfully. Here are the details:</p>
      <ul>
        <li><span class="label">Item:</span> ${itemName}</li>
        <li><span class="label">Start:</span> ${new Date(start).toLocaleString()}</li>
        <li><span class="label">End:</span> ${new Date(end).toLocaleString()}</li>
        <li><span class="label">Quantity:</span> ${bookedQuantity}</li>
      </ul>
      <p>We’ll notify you once your request is reviewed and approved.</p>
      <p>Thanks,<br/>Inventory Team</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Inventory Gymkhana · IIT Bhubaneswar
    </div>
  </div>
</body>

    `,
  };

  await transporter.sendMail(mailOptions);
}
