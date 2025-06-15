import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';


export const ChatNPTRoute = (router: AppRouterInstance) => {
    const chatNPTUrl = process.env.NEXT_PUBLIC_CHATNPT_URL;
    if (chatNPTUrl) {
        window.location.href = chatNPTUrl;
    } else {
        router.push('/ChatNPT');
    }
};