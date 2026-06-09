import {Button, ButtonGroup, ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper, Tooltip} from "@mui/material";
import {ArrowDropDownIcon} from "@mui/x-date-pickers";
import {useRef, useState} from "react";


export default function SplitButton({
    pretext="Deploy",
    options=["All", "None"],
    loading=false,
    onClick=(selectedOption)=>{
        console.log(`clicked ${selectedOption}!`);
    },
    disabled = false
}) {

    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex ] = useState(0);
    const anchorRef = useRef(null);

    const handleToggle = () => {
        setOpen(()=>!open);
    }

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }

        setOpen(false);
    }

    const handleMenuItemClick = (event, index) => {
        setSelectedIndex(index);
        setOpen(false);
        onClick(options[index]);
    }

    return <>
        <ButtonGroup
            variant="outlined"
            aria-label="Button groupd with nested menu"
            ref={anchorRef}
            sx={{ textWrap: "nowrap" , maxWidth: 300 }}
            disabled={disabled}
        >
            <Tooltip
                title="Click here to deploy the configuration"
            >
                <Button
                    // variant="outlined"
                    size="medium"
                    loadingPosition="start"
                    loading={loading}
                    onClick={
                        ()=>onClick(options[selectedIndex])
                    }
                >
                    { (!loading) ? `${pretext} ${options[selectedIndex]}` : `Processing ${options[selectedIndex]}`}
                </Button>
            </Tooltip>
            <Tooltip title={"Further deploy options"}>
                <Button
                    size="small"
                    aria-controls={open ? 'split-button-menu' : undefined}
                    aria-expanded={open ? 'true' : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                    disabled={loading}
                >
                    <ArrowDropDownIcon/>
                </Button>
            </Tooltip>
        </ButtonGroup>
        <Popper
            sx={{ zIndex: 1 }}
            open={open}
            anchorEl={anchorRef.current}
            role={undefined}
            transition
            disablePortal
        >
            {({ TransitionProps, placement }) => (
                <Grow
                    {...TransitionProps}
                    style={{
                        transformOrigin:
                            placement === 'bottom' ? 'center top' : 'center bottom',
                    }}
                >
                    <Paper>
                        <ClickAwayListener onClickAway={handleClose}>
                            <MenuList id="split-button-menu" autoFocusItem>
                                {options.map((option, index) => (
                                    <MenuItem
                                        key={option}
                                        // disabled={index === 2}
                                        selected={index === selectedIndex}
                                        onClick={(event) => handleMenuItemClick(event, index)}
                                    >
                                        {option}
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </ClickAwayListener>
                    </Paper>
                </Grow>
            )}
        </Popper>
    </>
}
