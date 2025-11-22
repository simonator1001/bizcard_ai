import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get session ID and return URL from query parameters
  const sessionId = req.query.session_id as string;
  const returnUrl = req.query.return_url as string;

  if (!sessionId || !returnUrl) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Send an HTML page that simulates a payment form and redirects after submission
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Payment Checkout</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .container {
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .card {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 32px;
            margin-bottom: 24px;
          }
          h1 {
            color: #6a49eb;
            font-size: 28px;
            margin-top: 0;
            margin-bottom: 24px;
            text-align: center;
          }
          .form-group {
            margin-bottom: 16px;
          }
          label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
          }
          input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
          }
          .checkout-details {
            background-color: #f9f9f9;
            border-radius: 4px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .total {
            font-weight: bold;
            color: #6a49eb;
          }
          button {
            background: linear-gradient(135deg, #e51c5d 0%, #9217de 100%);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 16px 24px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s ease;
          }
          button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
          .secure-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 24px;
            color: #666;
            font-size: 14px;
          }
          .secure-badge svg {
            margin-right: 8px;
          }
          .powered-by {
            text-align: center;
            margin-top: 24px;
            font-size: 14px;
            color: #666;
          }
          .powered-by img {
            height: 24px;
            vertical-align: middle;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1>Complete Your Payment</h1>
            
            <div class="checkout-details">
              <div class="detail-row">
                <span>Subscription Plan</span>
                <span>Pro Plan</span>
              </div>
              <div class="detail-row">
                <span>Billing Cycle</span>
                <span>Monthly</span>
              </div>
              <div class="detail-row total">
                <span>Total Due Today</span>
                <span>$9.99</span>
              </div>
            </div>
            
            <div class="form-group">
              <label for="card-number">Card Number</label>
              <input 
                type="text" 
                id="card-number" 
                placeholder="4242 4242 4242 4242" 
                maxlength="19"
                value="4242 4242 4242 4242"
                readonly
              />
            </div>
            
            <div style="display: flex; gap: 16px;">
              <div class="form-group" style="flex: 1;">
                <label for="expiry">Expiry Date</label>
                <input 
                  type="text" 
                  id="expiry" 
                  placeholder="MM/YY" 
                  maxlength="5"
                  value="12/25"
                  readonly
                />
              </div>
              <div class="form-group" style="flex: 1;">
                <label for="cvc">CVC</label>
                <input 
                  type="text" 
                  id="cvc" 
                  placeholder="123" 
                  maxlength="3"
                  value="123"
                  readonly
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="name">Cardholder Name</label>
              <input 
                type="text" 
                id="name" 
                placeholder="John Smith"
                value="Test User"
                readonly
              />
            </div>
            
            <button id="submit-btn">Complete Payment</button>
            
            <div class="secure-badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Secure Payment
            </div>
          </div>
          
          <div class="powered-by">
            <strong>TEST MODE</strong> - No actual payment will be processed
          </div>
        </div>
        
        <script>
          // Add a delay before redirecting to simulate payment processing
          document.getElementById('submit-btn').addEventListener('click', function() {
            this.disabled = true;
            this.innerHTML = 'Processing...';
            
            // Redirect to the success page after a short delay
            setTimeout(function() {
              window.location.href = "${returnUrl}";
            }, 1500);
          });
        </script>
      </body>
    </html>
  `);
} 