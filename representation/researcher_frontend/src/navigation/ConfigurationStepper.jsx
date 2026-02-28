import {Box, Button, Step, StepButton, StepLabel, Stepper, Tooltip} from "@mui/material";
import {useState} from "react";

import {CheckCircleOutlineOutlined, CircleOutlined} from "@mui/icons-material";

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
            {/*Spacing such that the button is on the left */}
            {/*<Box sx={{flex: '1 1 auto'}}/>*/}
            {/*{(completedSteps[activeStep]) ? (*/}
            {/*    <Tooltip title={"Click to mark the current step as uncompleted. Only completed steps will be part of the experiment."}>*/}
            {/*        <Button*/}
            {/*            variant="outlined"*/}
            {/*            startIcon={<CheckCircleOutlineOutlined />}*/}
            {/*            onClick={()=>{onMarkedClicked(false)}}*/}
            {/*        >*/}
            {/*            Step Uncompleted*/}
            {/*        </Button>*/}
            {/*    </Tooltip>*/}
            {/*    ) : (*/}
            {/*        <Tooltip title={"Click to mark the current step as completed. Only completed steps will be part of the experiment."}>*/}
            {/*            <Button*/}
            {/*                variant="outlined"*/}
            {/*                startIcon={<CircleOutlined />}*/}
            {/*                onClick={()=>{onMarkedClicked(true)}}*/}
            {/*            >*/}
            {/*                Step Completed*/}
            {/*            </Button>*/}
            {/*        </Tooltip>*/}
            {/*    )*/}
            {/*}*/}
        </Box>
    </Box>
   )
}