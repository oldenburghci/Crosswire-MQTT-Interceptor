import {
    Button, ButtonBase,
    ButtonGroup, CircularProgress,
    ClickAwayListener, Grid2,
    Grow,
    MenuItem, MenuList,
    Paper,
    Popper, Stack,
    Tooltip, Typography,
} from "@mui/material";
import {Add, SortByAlpha} from "@mui/icons-material";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useSpring, animated} from '@react-spring/web';
import {ArrowDropDownIcon} from "@mui/x-date-pickers";

export default function AddDeviceButton({
    options=[],
    onAdd=(arg)=>{},
    tooltip="Add another device to the configuration"
}) {
    // console.log(options);

    const [clicked, setClicked] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const anchorRef = useRef(null);
    const [selectedSorting, setSelectedSorting ] = useState(-1);

    const AnimatedButton = animated(Button);

    const propsLeftExpand = useSpring({
        width: (clicked) ?  100  : 0,
        visibility: (clicked) ? 'visible' : 'hidden',
        from: {
            width: (clicked) ? 0 : 100,
            visibility: (clicked) ? 'hidden' : 'visible',
        },
    });

    //close the select dialog
    useEffect(() => {
        if (selectedIndex !== -1){
            setOpen(()=>false);
            setClicked(()=>false);
        }
        setSelectedIndex(-1);
    }, [selectedIndex])

    const propsBorderRadius = useSpring({
        // borderRadius: (clicked) ? "25px 25px 25px 25px" : 0 ,
        borderTopLeftRadius: (clicked) ? 25 : 2,
        borderBottomLeftRadius: (clicked) ? 25 : 2,
        borderTopRightRadius: (clicked) ? 0 : 2,
        borderBottomRightRadius: (clicked) ? 0 : 2,
        from: {
            borderTopLeftRadius: (clicked) ? 25 : 2,
            borderBottomLeftRadius: (clicked) ? 25 : 2,
            borderTopRightRadius: (clicked) ? 0 : 2,
            borderBottomRightRadius: (clicked) ? 0 : 2,
        }
    })

    const handleClose = ()=>{
        setOpen(false);
        setClicked(false);
    }
    const {sortFx} = useMemo(()=>{
        if (selectedSorting === -1 ) return {sortFx: (a, b) => 0};
        //define sort other functions here
        const sortFxs = [
            (a,b) => {
                if (a.friendlyName > b.friendlyName) return -1;
                if (a.friendlyName < b.friendlyName) return 1;
                return 0;
            },
            (a,b) => {
                if (a.friendlyName > b.friendlyName) return 1;
                if (a.friendlyName < b.friendlyName) return -1;
                return 0;
            }
        ]
        return {sortFx: sortFxs[selectedSorting]};
    },[selectedSorting]);

    return (
        <>
            <ButtonGroup
                variant="contained"
                ref={anchorRef}
            >
                <Tooltip
                    title={!clicked ? tooltip : "fetching available items"}
                >
                    <AnimatedButton
                        style={propsBorderRadius}
                        onClick={()=> {
                            setClicked(!clicked);
                            setOpen(true);
                        }}
                        loading={clicked}
                        disabled={options.length === 0}
                    >
                        < Add />
                    </AnimatedButton>
                </Tooltip>
                {(clicked) && <Tooltip title={""}>
                    <AnimatedButton
                        style={propsLeftExpand}
                        sx={{
                            justifyContent: 'flex-end'
                        }}
                        onClick={
                            () => {
                                setOpen(true);
                            }
                        }
                    >
                        {(clicked) && <ArrowDropDownIcon/>}
                    </AnimatedButton>
                </Tooltip>}
            </ButtonGroup>
            {(options.length !== 0) && (<Popper
                sx={{zIndex: 1}}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({TransitionProps, placement}) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        {
                            <Paper>
                                <ClickAwayListener onClickAway={handleClose}>
                                    <Grid2
                                        container
                                        sx={{
                                            m: 1
                                        }}
                                    >
                                        <Grid2
                                            size={12}
                                        >
                                            <Stack
                                                direction="row"
                                            >
                                                <ButtonGroup
                                                    size="small"
                                                    sx={{
                                                        p: 1
                                                    }}
                                                >
                                                    <Tooltip title={"Sort alphabetically ascending"}>
                                                        <Button
                                                            variant={(selectedSorting === 0) ? "contained" : "outlined"}
                                                            onClick={() => {
                                                                setSelectedSorting(0);
                                                            }}
                                                        >
                                                            <SortByAlpha/>
                                                        </Button>
                                                    </Tooltip>

                                                    <Tooltip title={"Sort alphabetically descending"}>
                                                        <Button
                                                            variant={(selectedSorting === 1) ? "contained" : "outlined"}
                                                            onClick={() => {
                                                                setSelectedSorting(1);
                                                            }}
                                                        >
                                                            <SortByAlpha sx={{
                                                                transform: "scaleX(-1)"
                                                            }}/>
                                                        </Button>
                                                    </Tooltip>
                                                </ButtonGroup>
                                            </Stack>
                                        </Grid2>
                                        <MenuList
                                            id="split-button-menu"
                                            autoFocusItem
                                        >
                                            {(
                                                (options.length >= 12) ? (
                                                    <Grid2
                                                        container
                                                        sx={{
                                                            m: 1,
                                                            maxWidth: 800,
                                                        }}
                                                    >
                                                        {
                                                            options.sort(sortFx).map((item, index) => {
                                                                return (
                                                                    <Grid2
                                                                        size={2}
                                                                        sx={{
                                                                            p: 1,
                                                                            width: 200,
                                                                            ':hover': {
                                                                                bgcolor: 'rgba(255,255,255,0.08)',
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Tooltip
                                                                            title={`${item.friendlyName}${(item.unavailable) ? 'is not available' : ''}`}>
                                                                            <ButtonBase
                                                                                sx={{
                                                                                    width: '100%',
                                                                                    color: "text.primary",
                                                                                    textDecorationLine: (item.unavailable) ? "line-through" : "",
                                                                                }}
                                                                                onClick={
                                                                                    (item.unavailable) ? () => {
                                                                                    } : () => {
                                                                                        console.log(`item clicked ${item.friendlyName}`)
                                                                                        setSelectedIndex(index);
                                                                                        onAdd(options[index]);
                                                                                        // onAdd(options[index]);
                                                                                    }
                                                                                }
                                                                                key={index}
                                                                            >
                                                                                <Typography
                                                                                    sx={{wordBreak: "break-word"}}
                                                                                    noWrap>
                                                                                    {item.friendlyName}
                                                                                </Typography>
                                                                            </ButtonBase>
                                                                        </Tooltip>
                                                                    </Grid2>
                                                                )
                                                            })
                                                        }
                                                    </Grid2>
                                                ) : (
                                                    options.sort(sortFx).map((item, index) => (
                                                            <MenuItem
                                                                sx={{
                                                                    color: "text.primary",
                                                                    textDecorationLine: (item.unavailable) ? "line-through" : ""
                                                                }}
                                                                onClick={
                                                                    (item.unavailable) ? () => {
                                                                    } : () => {
                                                                        onAdd(options[index]);
                                                                        setSelectedIndex(index);
                                                                    }
                                                                }
                                                                key={index}
                                                            >
                                                                {(item.unavailable) ?
                                                                    <Tooltip title={"This item is not available"}>
                                                                        {item.friendlyName}
                                                                    </Tooltip> : item.friendlyName}
                                                            </MenuItem>
                                                        ))
                                                    )
                                                )
                                            }
                                        </MenuList>
                                    </Grid2>
                                </ClickAwayListener>
                            </Paper>
                        }
                    </Grow>
                )}
            </Popper>)}
        </>
    )
}