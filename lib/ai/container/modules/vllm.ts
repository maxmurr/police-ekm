import { createModule } from "@evyweb/ioctopus";
import { DI } from "../tokens";
import type { AIRegistry } from "../types";
import { createVllmRetryableModel } from "../../providers/vllm";

export const vllmModule = createModule<AIRegistry>();
vllmModule.bind(DI.GET_RETRYABLE_MODEL).toValue(createVllmRetryableModel);
