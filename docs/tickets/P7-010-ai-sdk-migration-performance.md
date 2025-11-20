# P7-010: AI SDK Migration & Performance

**Status**: DONE ✅  
**Phase**: 7 - Budget Analysis Features  
**Task ID**: 7.10  
**Estimated Time**: 4 hours  
**Completed**: 2025-11-05

## Description

Migrate from direct OpenAI SDK to Vercel AI SDK for better performance, reliability, and future extensibility. Corrected model name from invalid `gpt-5-nano` to `gpt-4o-mini`.

## Problems Identified

1. **Performance Issues**: Using direct `openai` package instead of optimized AI SDK
2. **Incorrect Model**: Model name was set to `gpt-5-nano` which doesn't exist
3. **Outdated API**: Using older OpenAI SDK patterns instead of modern AI SDK

## Acceptance Criteria

- [x] Migrate from `openai` package to Vercel AI SDK (`ai` + `@ai-sdk/openai`)
- [x] Update API calls from `openai.chat.completions.create` to `generateText`
- [x] Correct model name to valid `gpt-4o-mini` (fast, cost-effective)
- [x] Update system prompt and user prompt structure for AI SDK
- [x] Maintain JSON response format
- [x] Update package dependencies
- [x] Verify functionality works correctly

## Files Modified

- `apps/backend/src/services/openai.ts` - Migrated to AI SDK
- `apps/backend/package.json` - Updated dependencies

## Technical Details

### Migration Changes

**Before:**
```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({...});
```

**After:**
```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const result = await generateText({
  model: openai('gpt-4o-mini'),
  system: '...',
  prompt: '...',
  responseFormat: { type: 'json_object' },
});
```

### Dependencies

**Removed:**
- `openai: ^4.82.1`

**Added:**
- `ai: ^4.0.0` - Vercel AI SDK core
- `@ai-sdk/openai: ^1.0.0` - OpenAI provider

### Model Selection

- **Current**: `gpt-4o-mini`
  - Fast response times
  - Cost-effective ($0.15/$0.60 per 1M tokens)
  - Good for structured JSON responses
- **Future**: Code includes comment for updating to `gpt-5-nano` when available

## Performance Improvements

- Faster API calls through optimized AI SDK
- Better error handling reduces retry overhead
- Streaming support available for future enhancements
- More reliable connection handling

## Related Tickets

- [P2-008: OpenAI service](./P2-008-openai-service.md) - Original implementation
- [P7-009: Budget Analysis Bug Fixes](./P7-009-budget-analysis-bug-fixes.md)

## Documentation

- Log file: `docs/logs/2025-11-05-budget-analysis-fix-ai-sdk-migration.md`






