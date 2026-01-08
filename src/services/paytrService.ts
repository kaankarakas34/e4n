import { User } from '../types';

interface PaymentParams {
    merchant_oid: string;
    email: string;
    payment_amount: number; // in cents (kuruş)
    user_name: string;
    user_address: string;
    user_phone: string;
    merchant_ok_url: string;
    merchant_fail_url: string;
    user_basket: string;
    debug_on: number;
    test_mode: number;
    no_installment: number;
    max_installment: number;
    currency: string;
    lang: string;
}

interface PayTRTokenResponse {
    status: 'success' | 'failed';
    token?: string;
    reason?: string;
}

// Mock Merchant Config
const MERCHANT_ID = 'XXXXXX';

export const PayTRService = {
    /**
     * Initializes a payment request.
     * In a real application, this would call your backend to generate the specific hash and get the token from PayTR.
     * Here we mock the behavior or simulate the backend response for the frontend integration.
     */
    async getPaymentToken(user: User, product: { name: string; price: number }, type: 'MEMBERSHIP' | 'EVENT'): Promise<PayTRTokenResponse> {
        console.log('Initializing PayTR Payment for:', { user, product, type });

        // Simulate Network Delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real app, you would POST to your backend here.
        // Your backend would then perform the Node.js steps seen in the documentation
        // (calculate hash, POST to paytr.com/odeme/api/get-token)
        // and return the { status: 'success', token: '...' } to the frontend.

        // Mock Success Response
        // We return a dummy token. In a real scenario, this token allows the iframe to load the payment page.
        // For testing without real PayTR credentials, we might need to handle this specially in the Modal.
        // However, if we want to see the REAL PayTR test page, we need valid credentials.
        // Without valid credentials, the iframe will show an error.
        // For now, we assume the user might provide credentials later or we use this mock to verify the flow up to the iframe opening.

        return {
            status: 'success',
            token: 'mock_token_' + Date.now(),
        };
    },

    /**
     * Verifies the payment callback hash (Backend only usually).
     * Frontend usually doesn't need this unless handling some specific client-side logic post-redirect.
     */
    verifyHash(params: any) {
        // Implementation would go here if needed server-side
        return true;
    }
};
