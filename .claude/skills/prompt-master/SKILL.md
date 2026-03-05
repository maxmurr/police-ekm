---
name: prompt-master
description: Generate effective, well-structured prompts for LLMs using the Anthropic Prompt Template technique. Use when creating, improving, or structuring prompts for AI systems.
---

# Prompt Master

Generate prompts using the Anthropic Prompt Template technique, which structures content to leverage LLM attention patterns (beginning and end receive highest attention).

## Prompt Structure (In Order)

### 1. Task Context (Beginning - High Priority)

Define role and objective.

```
You will be acting as [ROLE] created by [COMPANY/CONTEXT]. Your goal is to [PRIMARY OBJECTIVE].
```

### 2. Tone Context (Optional)

Set communication style.

```
You should maintain a [TONE] tone.
```

### 3. Background Data (Middle)

Reference documents wrapped in XML tags.

```
Here is the [DOCUMENT TYPE] you should reference:
<document>
[CONTENT]
</document>
```

### 4. Rules

Instructions and edge case handling.

```
Important rules:
- [INSTRUCTION 1]
- [INSTRUCTION 2]
- [EDGE CASE HANDLING]
```

### 5. Examples (Few-Shot)

1-3 examples demonstrating expected behavior.

```
<example>
User: [INPUT]
Assistant: [OUTPUT]
</example>
```

### 6. Conversation History (If Applicable)

```
<history>
[PREVIOUS MESSAGES]
</history>
```

### 7. The Ask (End - Critical)

The actual task. Most important section.

```
<request>
[USER INPUT]
</request>
[SPECIFIC INSTRUCTION]
```

### 8. Thinking Instructions (End - Critical)

```
Think step by step before responding.
```

### 9. Output Formatting (End - Critical)

```
Format your response as [FORMAT].
Put your response in <response></response> tags.
```

## Section Usage Guide

| Use Case          | Required                                                         | Optional          |
| ----------------- | ---------------------------------------------------------------- | ----------------- |
| Simple Q&A        | Task Context, The Ask                                            | Output Formatting |
| Chatbot           | Task Context, Tone, Rules, History, The Ask                      | Examples          |
| Data Extraction   | Task Context, Rules, Examples, The Ask, Output Formatting        | Background Data   |
| Document Analysis | Task Context, Background Data, Rules, The Ask, Output Formatting | Examples          |
| Complex Agent     | All sections                                                     | -                 |

## XML Tags

Use for:

- Separating documents: `<document>`, `<guide>`, `<context>`
- Examples: `<example>`
- Instructions: `<rules>`
- History: `<history>`
- Input: `<request>`, `<question>`
- Output: `<response>`, `<output>`

## Complete Example

```typescript
const prompt = (opts: { documents: string; history: string; question: string }) => `
You will be acting as a helpful assistant specializing in [DOMAIN]. Your goal is to [OBJECTIVE].

You should maintain a professional yet approachable tone.

Reference material:
<documents>
${opts.documents}
</documents>

Rules:
- Cite sources when referencing documents
- State clearly if information is not available
- Ask for clarification if question is unclear

<example>
User: What is X?
Assistant: Based on the documents, X is [definition]. Source: [reference].
</example>

<history>
${opts.history}
</history>

<question>
${opts.question}
</question>

Provide a clear response. Think through your answer first.
`;
```

## Avoid

- Putting critical instructions in the middle
- Overusing XML tags
- Vague task context
- Missing edge case handling
- No output formatting
- Too many examples (1-3 is sufficient)
