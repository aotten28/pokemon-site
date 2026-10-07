export type Trait = 'curiosity' | 'courage' | 'sociability' | 'calm' | 'playfulness';
export type PartnerProfile = { id: number; traits: Record<Trait, number>; reason: string };
export const TRAITS: Trait[] = ['curiosity','courage','sociability','calm','playfulness'];
export const PARTNER_IDS = [1,4,7,25,35,39,52,54,58,63,66,74,81,92,95,113,115,123,125,133,143,147,152,155,158,172,175,179,194,197,200,215,246,252,255,258,280,282,285,300,304,359,371,390,393,396,403,448,470,475,478,483,501,506,570,610,658,700,722,778];
export const PARTNER_PROFILES: PartnerProfile[] = PARTNER_IDS.map((id, index) => ({ id, traits: Object.fromEntries(TRAITS.map((trait, traitIndex) => [trait, 1 + ((id * (traitIndex + 3) + index) % 5)])) as Record<Trait, number>, reason: ['Your curiosity and steady confidence make this a natural adventure companion.','This partner matches your bold, warm-hearted trainer energy.','A calm, playful bond built for discovering new places together.'][index % 3] }));
export const QUESTIONS: { trait: Trait; prompt: string; options: [string, string, string] }[] = [
  { trait: 'curiosity', prompt: 'A hidden trail appears on your map. What do you do?', options: ['Stay on the route you know', 'Check the map for clues first', 'Head down the trail immediately'] },
  { trait: 'curiosity', prompt: 'At a new town, what catches your attention first?', options: ['A familiar café', 'The local guidebook', 'A mysterious door or rumor'] },
  { trait: 'curiosity', prompt: 'Your partner brings you a strange object from the woods. You…', options: ['Put it back where it belongs', 'Study it carefully together', 'Set off to find where it came from'] },
  { trait: 'courage', prompt: 'A powerful Pokémon challenges you. Your first instinct is to…', options: ['Find a safer path around it', 'Watch and learn its moves', 'Step forward and meet the challenge'] },
  { trait: 'courage', prompt: 'Your group needs someone to make the first move. You…', options: ['Support whoever volunteers', 'Offer a thoughtful plan', 'Raise your hand before anyone else'] },
  { trait: 'courage', prompt: 'When a plan goes sideways, you tend to…', options: ['Pause until things settle', 'Adapt one step at a time', 'Turn the surprise into an opportunity'] },
  { trait: 'sociability', prompt: 'How do you spend a free afternoon at a Pokémon Center?', options: ['Recharge somewhere quiet', 'Chat with a trainer or two', 'Gather everyone for an impromptu adventure'] },
  { trait: 'sociability', prompt: 'You spot a new trainer who looks lost. You…', options: ['Give them some space', 'Point them toward useful resources', 'Introduce yourself and offer to travel together'] },
  { trait: 'sociability', prompt: 'Your favorite kind of victory is…', options: ['A personal milestone', 'A well-earned win with a trusted partner', 'A celebration shared by the whole crew'] },
  { trait: 'calm', prompt: 'A storm interrupts your journey. Your ideal response is…', options: ['Push through before it gets worse', 'Find shelter and reassess', 'Make camp and enjoy the pause'] },
  { trait: 'calm', prompt: 'Before an important battle, you feel best when you…', options: ['Get your energy up', 'Review the essentials', 'Take a deep breath and center yourself'] },
  { trait: 'calm', prompt: 'Your partner is having a rough day. You…', options: ['Distract them with something exciting', 'Ask what would help', 'Sit with them until they feel ready'] },
  { trait: 'playfulness', prompt: 'Which partner tradition sounds most like you?', options: ['A dependable training routine', 'A small ritual after each win', 'A goofy secret handshake or game'] },
  { trait: 'playfulness', prompt: 'You find a wide open field. What happens next?', options: ['You use it to practice', 'You take a scenic break', 'You race your partner to the horizon'] },
  { trait: 'playfulness', prompt: 'Your partner surprises you with a prank. Your reaction?', options: ['Pretend you did not notice', 'Smile and plan a gentle reply', 'Laugh and immediately prank them back'] },
];
export function rankPartners(scores: Record<Trait, number>) { return [...PARTNER_PROFILES].sort((a,b) => TRAITS.reduce((sum,t) => sum + Math.abs(scores[t] - a.traits[t]) - Math.abs(scores[t] - b.traits[t]), 0)); }
