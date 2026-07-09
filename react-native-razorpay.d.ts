declare module 'react-native-razorpay' {
    interface RazorpayOptions {
        key: string;
        subscription_id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        name?: string;
        description?: string;
        image?: string;
        prefill?: { email?: string; contact?: string; name?: string };
        theme?: { color?: string };
        [key: string]: unknown;
    }

    interface RazorpaySuccessResult {
        razorpay_payment_id: string;
        razorpay_subscription_id?: string;
        razorpay_order_id?: string;
        razorpay_signature: string;
    }

    interface RazorpayErrorResult {
        code: number | string;
        description: string;
    }

    const RazorpayCheckout: {
        open: (options: RazorpayOptions) => Promise<RazorpaySuccessResult>;
    };

    export default RazorpayCheckout;
}
