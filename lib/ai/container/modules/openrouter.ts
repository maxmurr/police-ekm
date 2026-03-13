import { createModule } from "@evyweb/ioctopus";
import { DI } from "../tokens";
import type { AIRegistry } from "../types";
import { createOpenRouterRetryableModel } from "../../providers/openrouter";

export const openrouterModule = createModule<AIRegistry>();
openrouterModule.bind(DI.GET_RETRYABLE_MODEL).toValue(createOpenRouterRetryableModel);
