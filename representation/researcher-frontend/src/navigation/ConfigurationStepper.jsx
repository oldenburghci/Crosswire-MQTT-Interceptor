import {Box, Step, StepButton, StepLabel, Stepper, Tooltip} from "@mui/material";

export default function ConfigurationStepper(
        {
            activeStep = 0,
            completedSteps = {0: false},
            onMarkedClicked = (marked) => {},
            onStepClicked = (index) => {},
            steps=[
                {
                    label:'sample label',
                    tooltip: 'sample tooltip'
                }
            ]
        }
    ) {

   return (
    <Box sx={{m: 2}}>
        <Stepper nonLinear activeStep={activeStep}>
            {
                steps.map((step, index) => {
                    return (
                        <Step completed={completedSteps[index]} key={step.label}>
                            <Tooltip title={step.tooltip}>
                                <StepButton
                                    onClick={() => { onStepClicked(index) }}
                                >
                                    <StepLabel
                                    >{step.label}
                                    </StepLabel>
                                </StepButton>
                            </Tooltip>
                        </Step>
                    )
                })
            }
        </Stepper>
        <Box sx={{display: "flex", flexDirection: "row", pt: 2}}>
        </Box>
    </Box>
   )
}