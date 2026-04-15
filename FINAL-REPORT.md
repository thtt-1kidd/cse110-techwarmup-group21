# Final Report
### One Arm AI Slot Machine Experiment

## Setup
Model + tool used: Gemini 2.5

Notes / Issues:
- Significant variability in output structure across runs
- Some outputs were incomplete or non-functional
- Slot machine “spinning animation” logic was frequently inconsistent or broken
- UI styling ranged from minimal to fully designed depending on run

Limitations: 
- Unable to track tokens during runs, missing tha data
- Strict prompt constraint limited exploration of alternative architectures
- No post-AI code editing allowed, so failures remained as data points


## Baseline Runs (50)
Across 50 runs using the exact same prompt, we observed a wide distribution of outputs.

Observations:
- Roughly a minority of runs produced fully working slot machine applications
- A large portion generated partially functional or visually incomplete apps
- A few runs failed to produce usable interactive behavior at all

Common Patterns:
- Inconsistent implementation of the spinning reel animation
- Token system (win/spend logic) often incomplete or missing
- Similar variation in HTML/CSS structures

Overall, the baseline runs demonstrated high variability despite identical input conditions.

## First Refinement (5 → 3)
In the first refinement stage, we selected the top 5 candidates based on functionality and completeness.

Observations:
- Improved UI consistency across most candidates
- Some improvement in error handling and usability

Limitations:
- Core logic issues (especially spinning mechanics) persisted in many cases
- Refinement improved presentation more than functionality

## Second Refinement (3 → 2)
At this stage, improvements became more incremental.

Observations:
- More consistent UI layout and styling
- Slight improvement in user interaction
  
Issues:
- No major architectural changes
- Differences between candidates became more subtle
  
## Third Refinement (2 → 1)
Final refinement focused on selecting the most stable and complete implementation.

Observations:
- The final candidate showed the most reliable slot machine behavior
- Token tracking and UI interaction were most consistent here

## Final Candidate + Final Refinement
The final candidate represented the best tradeoff between:

- Functional correctness
- UI polish
- Stability across multiple uses

The final refinement improved:
- Minor UI errors
- Sharpened effects

However, changes were incremental rather than transformative, reinforcing the limited scope of single-turn refinement.

## Key Findings
Answer the main experiment questions:
1. Consistency: How similar were the 50 runs?
   - The 50 runs were very similar when it came to testing. All the UIs looked similar, and barely any had features unique enough to point out from the others.
   - Iterations included a header, the 3 slot areas, a spin button, and new/reset game button. 
2. Drift: What kinds of variation did you see?
   - As we kept testing, we noticed the small details that made the difference between the different candidates. Primarily, we noticed differences with the spinning effect, and the buttons. 
   - Additionally, although candidates in the same step were prompted exactly the same, no two sites ever had the exact same design. 
3. Refinement Impact: Did one prompt actually help much?
   - Yes, the unique prompts helped a lot, since we knew generally what needed to be fixed, and specifically asked for that in the next prompt.
   - Overtime the prompts did make less and less of a difference. The chan
4. Limits of Prompting: Where did the AI struggle?
   - AI struggled in specifically capturing the slot machine we really wanted. We wanted something that was pretty, easy to use, and that worked all the time. However, when we wanted a specific thing, there'd be times when it'd take out another feature we wanted.
   - Early on the AI struggled to understand what "spinning" meant.
   - Implementing uneseccary feature, like restarting the game even when new game or reset fame was not clicked. 


## Final Takeaways
- Generative coding outputs are highly variable under identical prompts.
- Prompting is unreliable for consistency and refinement.
- Overtime, the effectiveness of re-writing prompting goes down, and you tend to hit a wall. 
- AI is very good at following design and thematical instructions.
- Structural stability remains a key limitation of using LLMs.

Overall, this experiment demonstrates the power of LLMs, and how they could be useful in the big picture, but when it comes down to the small details, it doesn't perform. When using AI for our project we should not become overealiant on generated code since, as we've seen, it can only get us so far. Instead we should use AI as a tool that helps us when we get stuck through direct and clear prompting rather than trying to get it to build the entire app. AI would overall be more helpful in the initial stages when it comes to design choices and theming as it seemed to successfully achieve this in most, if not all iterations. However, the structure of the sit and logic implementation should be handled more directly and not offloaded entirely to AI. 