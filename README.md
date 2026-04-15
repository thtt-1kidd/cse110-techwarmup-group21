# CSE110 Tech Warm-Up -- Group 21

## Overview
This contains our team's baseline and refinement runs for the One Arm AI SLot Machine Experiment.

## Model and Harness
- Model Used: Gemini 2.5
- Tool used: Gemini Code Assist
- Tech stack: HTML, CSS, JS, browser

## Repository structure
```text
.
├── prompts/        
|   ├── original-prompt.txt 
|   ├── refinement-prompt-step2.txt
|   ├── ...
│   └── refinement-prompt-step5.txt
├── results/        
|   ├── STEP1-RESULTS.md
|   ├── ...
│   └── STEP5-RESULTS.md
├── step1/         
│   ├── candidate-001/
|   ├── ...
|   └── candidate-050/
├── step2/          
│   ├── candidate-0XX-refinement-1/
|   ├── ...
|   └── candidate-0XX-refinement-1/ # 5 of these
├── step3/          
│   ├── candidate-028-refinement-2/
|   ├── candidate-029-refinement-2/
|   └── candidate-050-refinement-2/
├── step4/          
│   ├── candidate-028-refinement-2/
|   └── candidate-050-refinement-2/
├── step3/          
|   └── candidate-028-refinement-2/
├── FINAL-REPORT.md
├── MEASUREMENTS.md
├── README.md 
└── RUBRIC.md