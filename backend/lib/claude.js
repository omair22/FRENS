import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'
dotenv.config()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Suggests the best time for a hangout based on fren availability
 */
export const suggestBestTime = async (frens, availability) => {
  const prompt = `
    You are an AI scheduler for a social app called Frens.
    Given the following frens and their availability data:
    Frens: ${JSON.stringify(frens)}
    Availability: ${JSON.stringify(availability)}
    
    Choose the absolute best date and time for them to hang out.
    Return ONLY a JSON object with this exact structure:
    {
      "best_date": "YYYY-MM-DD",
      "best_time": "HH:MM",
      "frens_available": ["Name1", "Name2"],
      "frens_unavailable": ["Name3"],
      "reason": "Short catchy reason why this is the best slot"
    }
  `

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    })
    
    const text = msg.content[0].text
    return JSON.parse(text)
  } catch (err) {
    console.error('Claude suggestBestTime error:', err)
    return { error: 'Failed to generate suggestion' }
  }
}

/**
 * Generates a friendly nudge message for uncommitted frens
 */
export const generateNudge = async (hangout, rsvpStats) => {
  const prompt = `
    Generate a short, friendly, and trendy nudge message to send to frens who haven't RSVP'd yet.
    Hangout: ${hangout.title} at ${hangout.location} on ${hangout.datetime}.
    RSVP Stats: ${rsvpStats.going} in, ${rsvpStats.interested} eyeing it.
    
    Return ONLY the string message. No quotes, no preamble. Keep it under 140 characters.
  `

  try {
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    })
    
    return msg.content[0].text.trim()
  } catch (err) {
    console.error('Claude generateNudge error:', err)
    return "Hey! Don't forget to RSVP to the hangout! ✨"
  }
}
