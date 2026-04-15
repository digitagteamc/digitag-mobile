import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to the first splash screen to start the onboarding flow. 
  // In a real app we might verify if the user has already onboarded.
  return <Redirect href="/onboarding/splash1" />;
}
