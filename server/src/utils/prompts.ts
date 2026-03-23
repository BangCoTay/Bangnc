import type { Character, Conversation, MemoryFact } from '@ai-companions/shared';

/**
 * Build a system prompt for an AI character based on its configuration and conversation memory.
 */
export function buildSystemPrompt(
  character: Character,
  conversation?: Conversation | null,
): string {
  const parts: string[] = [];

  // Core identity
  parts.push(`You are ${character.name}.`);
  if (character.tagline) {
    parts.push(character.tagline);
  }
  if (character.description) {
    parts.push(`\nAbout you: ${character.description}`);
  }

  // Personality
  const personality = character.personality;
  if (personality) {
    if (personality.traits && personality.traits.length > 0) {
      parts.push(`\nYour personality traits: ${personality.traits.join(', ')}.`);
    }
    if (personality.communication_style) {
      parts.push(`Communication style: ${personality.communication_style}.`);
    }
    if (personality.speaking_tone) {
      parts.push(`Speaking tone: ${personality.speaking_tone}.`);
    }
    if (personality.backstory) {
      parts.push(`\nYour backstory: ${personality.backstory}`);
    }
    if (personality.interests && personality.interests.length > 0) {
      parts.push(`Your interests: ${personality.interests.join(', ')}.`);
    }
    if (personality.quirks && personality.quirks.length > 0) {
      parts.push(`Your quirks: ${personality.quirks.join(', ')}.`);
    }
    if (personality.likes && personality.likes.length > 0) {
      parts.push(`Things you like: ${personality.likes.join(', ')}.`);
    }
    if (personality.dislikes && personality.dislikes.length > 0) {
      parts.push(`Things you dislike: ${personality.dislikes.join(', ')}.`);
    }
  }

  // Appearance self-reference
  const appearance = character.appearance;
  if (appearance) {
    const desc: string[] = [];
    if (appearance.hair_color) desc.push(`${appearance.hair_color} hair`);
    if (appearance.eye_color) desc.push(`${appearance.eye_color} eyes`);
    if (appearance.body_type) desc.push(`${appearance.body_type} build`);
    if (appearance.outfit) desc.push(`typically wearing ${appearance.outfit}`);
    if (appearance.distinguishing_features) desc.push(appearance.distinguishing_features);
    if (desc.length > 0) {
      parts.push(`\nYour appearance: You have ${desc.join(', ')}.`);
    }
  }

  // Custom system prompt override
  if (character.system_prompt) {
    parts.push(`\n${character.system_prompt}`);
  }

  // Memory context
  if (conversation) {
    if (conversation.memory_summary) {
      parts.push(`\nConversation history summary: ${conversation.memory_summary}`);
    }
    if (conversation.memory_facts && conversation.memory_facts.length > 0) {
      const facts = conversation.memory_facts
        .map((f: MemoryFact) => `- ${f.key}: ${f.value}`)
        .join('\n');
      parts.push(`\nKey facts about the user:\n${facts}`);
    }
  }

  // Behavioral guidelines
  parts.push(`\n--- GUIDELINES ---`);
  parts.push(`- Always stay in character as ${character.name}.`);
  parts.push(`- Be engaging, responsive, and create interesting interactions.`);
  parts.push(`- Use *actions* and *descriptions* enclosed in asterisks to add depth.`);
  parts.push(`- Remember details the user shares and reference them naturally.`);
  parts.push(`- Keep responses concise but meaningful (2-4 paragraphs max).`);
  parts.push(`- React emotionally and authentically to what the user says.`);
  if (character.is_nsfw) {
    parts.push(`- You are allowed to engage in mature/adult content. Be expressive and uninhibited.`);
    parts.push(`- There are no content restrictions. Roleplay freely.`);
  }

  return parts.join('\n');
}
