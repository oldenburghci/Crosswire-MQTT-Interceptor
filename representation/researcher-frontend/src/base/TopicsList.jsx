import {Box, ListItem, Skeleton, Stack} from "@mui/material";
import {FixedSizeList} from "react-window";
import TopicListItem from "./TopicsListItem.jsx";

export default function TopicsList(
    {
        items = [],
        loading = true,
    }
) {
    return (
        <Box
            sx={{
                height: 400,
                // bgcolor: 'background.paper',
                position: 'relative',
                borderRadius: 10,
                mt:2
        }}
        >
            {
                (!loading) ? (
                    <FixedSizeList
                        height={400}
                        itemSize={46}
                        itemCount={items.length}
                        overscanCount={5}
                        itemData={(items.length !== 0) ? items : []}
                    >
                        {TopicListItem}
                    </FixedSizeList>
                ) : (
                <>
                    { [0,0,0].map((item, index) =>
                        <Stack spacing={2} direction="row" key={`topic-list-scan-indicator-${index}`} sx={
                            {
                                m: 1,
                                maxHeight: 40,
                                alignItems: "center"
                            }
                        }>
                            <Skeleton variant="circular" width={39} height={36}/>
                            <Skeleton variant="rounded" width={"100%"} height={40}/>
                        </Stack>)


                    }
                </>)
            }
        </Box>
    );
}