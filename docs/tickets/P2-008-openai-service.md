# P2-008: OpenAI service

**Status**: DONE ✅  
**Phase**: 2 - Backend API & Services  
**Estimated Time**: Completed  
**Updated**: 2025-11-05 (Migrated to AI SDK)

## Description

Implement OpenAI service for budget analysis using OpenAI API. Originally used direct OpenAI SDK, later migrated to Vercel AI SDK for better performance.

## Acceptance Criteria

- [x] OpenAI client configured
- [x] Budget analysis function implemented
- [x] Fetches user expenses and goals
- [x] Generates analysis prompt
- [x] Returns formatted suggestions
- [x] Error handling implemented

## Files Created/Modified

- `apps/backend/src/services/openai.ts` (originally `src/server/services/openai.ts`)
- Migrated to Vercel AI SDK in 2025-11-05

## Migration Notes

- **2025-11-05**: Migrated from `openai` package to Vercel AI SDK (`ai` + `@ai-sdk/openai`)
- Model updated from `gpt-5-nano` (invalid) to `gpt-4o-mini` (valid, fast, cost-effective)
- See [P7-010: AI SDK Migration & Performance](./P7-010-ai-sdk-migration-performance.md) for details

## Related Tickets

- [P2-005: Budget analysis route](./P2-005-budget-analysis-route.md)
- [P7-001: Budget Analysis UI](./P7-001-budget-analysis-ui.md)
- [P7-010: AI SDK Migration & Performance](./P7-010-ai-sdk-migration-performance.md)

## Dependencies

- OpenAI API key in environment variables




