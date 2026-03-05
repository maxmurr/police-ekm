                         USER QUERYY
                              |
                              v
                    ┌──────────────────┐
                    |   CLASSIFIER     |
                    |  (Route Query)   |
                    └────────┬─────────┘
                             |
                    INFORMATION / GENERAL
                             |
              ┌──────────────┴──────────────┐
              |                             |
        INFORMATION                      GENERAL
              |                             |
              v                             v
    ┌─────────────────────┐       ┌─────────────────┐
    | QUERY PLANNER       |       |  GENERAL AGENT  |
    | (Generate 1-5 SQL)  |       |   (Direct LLM)  |
    └──────────┬──────────┘       └────────┬────────┘
               |                           |
               v                           |
    ┌─────────────────────┐                |
    | QUERY EXECUTOR      |                |
    | (Parallel Exec)     |                |
    └──────────┬──────────┘                |
               |                           |
               v                           |
    ┌─────────────────────┐                |
    | RESULT SYNTHESIZER  |                |
    | (+ Optional Follow) |                |
    └──────────┬──────────┘                |
               |                           |
               v                           |
    ┌─────────────────────┐                |
    | INFORMATION AGENT   |                |
    | (Analyze & Respond) |                |
    └──────────┬──────────┘                |
               |                           |
         STREAM TEXT                       |
               |                           |
               v                           |
    ┌─────────────────────┐                |
    | CHART GENERATOR     |                |
    | (Analyze Results)   |                |
    └──────────┬──────────┘                |
               |                           |
        0-3 CHART CONFIGS                  |
               |                           |
         STREAM CHARTS                     |
               |                           |
               └──────────┬────────────────┘
                          |
                          v
                   COMPLETE RESPONSE
