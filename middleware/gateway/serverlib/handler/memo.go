package handler

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/utils"
	"net/http"
	"slices"
	"time"
)

func GetMemosHandler(ctx *gin.Context) {
	response := make([]*MemoWithTime, 0)
	resourceIDs, isIn := ctx.Get("resources")
	if !isIn {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	//fmt.Println(resourceIDs)
	for _, resourceID := range resourceIDs.([]string) {
		memo, err := serverlib.MODEL_PROVIDER.GetMemoByResourceID(resourceID)
		if err != nil {
			//not all guid will yield a memo
			//ctx.JSON(http.StatusInternalServerError, gin.H{
			//	"message": "internal server error",
			//})
			continue
		}
		response = append(response, convertToMemoWithTime(memo))
	}
	ctx.JSON(http.StatusOK, gin.H{
		"memos": response,
	})
}

func GetMemoHandler(ctx *gin.Context) {
	memo, err := serverlib.MODEL_PROVIDER.GetMemoByResourceID(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	response := convertToMemoWithTime(memo)

	ctx.JSON(http.StatusOK, gin.H{
		"memo": response,
	})
}

func CreateMemoHandler(ctx *gin.Context) {
	memo := &types.Memo{}
	uid, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		fmt.Println(err)
		return
	}

	if err := ctx.ShouldBind(memo); err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "malformed request body",
		})
		return
	}

	memo.OwnerID = uid
	if err := serverlib.MODEL_PROVIDER.CreateMemo(memo); err != nil {
		fmt.Println(err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{
		"message":    "created",
		"resourceID": memo.ResourceID.String(),
	})
}

func UpdateShareMemoHandler(ctx *gin.Context) {
	request := ShareMemoRequest{}
	currentMemo, err := serverlib.MODEL_PROVIDER.GetMemoByResourceID(ctx.Param("id"))
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	if err := ctx.ShouldBind(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "malformed request body",
		})
		return
	}
	//identify user
	currentUsers := currentMemo.MemoSharedWith
	//TODO: Auth model is never initialized in this module
	users, err := serverlib.AUTH_MODEL_DB.GetUsersByUsernames(request.SharedWithUsers)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	//delete current shared with to avoid duplications
	if err := serverlib.MODEL_PROVIDER.DeleteMemoSharedWiths(currentMemo); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		currentMemo.MemoSharedWith = currentUsers
		if err := serverlib.MODEL_PROVIDER.UpdateMemo(currentMemo); err != nil {
			fmt.Printf("%s\n", err.Error())
			fmt.Printf("user recovery failed\n")
		}
		return
	}
	// transfer the request infos
	currentMemo.Shared = request.Shared
	currentMemo.MemoSharedWith = make([]types.MemoSharedWith, 0)
	for _, user := range users {
		currentMemo.MemoSharedWith = append(currentMemo.MemoSharedWith, types.MemoSharedWith{
			UserID: user.ID,
			MemoID: currentMemo.ID,
		})
	}
	//run update
	if err := serverlib.MODEL_PROVIDER.UpdateMemo(currentMemo); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "update successful",
	})
}

func DeleteMemoHandler(ctx *gin.Context) {
	currentMemo, err := serverlib.MODEL_PROVIDER.GetMemoByResourceID(ctx.Param("id"))
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	if err := serverlib.MODEL_PROVIDER.DeleteMemo(currentMemo); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "deleted",
	})
}

func UpdateMemoItemsHandler(ctx *gin.Context) {
	request := GeneralMemoItemsRequest{}

	if err := ctx.ShouldBind(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "malformed request body",
		})
		return
	}
	//fmt.Printf("%+v\n", request)

	currentMemo, err := serverlib.MODEL_PROVIDER.GetMemoByResourceID(ctx.Param("id"))
	currentItems := currentMemo.MemoItems
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
	}

	for _, memoItem := range request.MemoItems {
		// get the current item to fetch its model
		i := slices.IndexFunc(currentItems, func(item types.MemoItem) bool {
			//fmt.Printf("%s==%s=%t", item.ResourceID.String(), memoItem.ResourceID.String(), item.ResourceID == memoItem.ResourceID)
			return item.ResourceID == memoItem.ResourceID
		})
		if i == -1 {
			//invalid resource id, throw error?
			continue
		}

		currentItem := currentItems[i]
		memoItem.Model = currentItem.Model
		memoItem.MemoID = currentItem.MemoID
		memoItem.OwnerID = currentItem.OwnerID

		//fmt.Printf("currentItem: %+v\n memoItem: %+v\n", currentItem, memoItem)

		if err := serverlib.MODEL_PROVIDER.UpdateMemoItem(&memoItem); err != nil {
			fmt.Printf("%s\n", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"message": "internal server error",
			})
		}
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "update successful",
	})
}

func CreateMemoItemsHandler(ctx *gin.Context) {
	// the same request structure works as well here
	request := GeneralMemoItemsRequest{}

	if err := ctx.ShouldBind(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "malformed request body",
		})
		return
	}

	memoID := ctx.Param("id")
	//should not yield an error at this stage
	uid, _ := utils.GetUserIDFromContext(ctx)
	//get the "parent" memo to set the reference
	memo, err := serverlib.MODEL_PROVIDER.GetMemoByResourceID(memoID)
	memoItems := make([]*types.MemoItem, 0)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	for _, memoItem := range request.MemoItems {
		memoItem.MemoID = memo.ID
		memoItem.OwnerID = uid
		memoItems = append(memoItems, &memoItem)
	}

	if err := serverlib.MODEL_PROVIDER.CreateMemoItems(memoItems); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	resourceIDCollector := make([]uuid.UUID, 0)
	for _, memoItem := range memoItems {
		resourceIDCollector = append(resourceIDCollector, memoItem.ResourceID)
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":     "create successful",
		"resourceIDs": resourceIDCollector,
	})
}

func DeleteMemoItemsHandler(ctx *gin.Context) {
	//works here as well
	request := GeneralMemoItemsRequest{}
	if err := ctx.ShouldBind(&request); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{
			"message": "malformed request body",
		})
		return
	}
	memoID := ctx.Param("id")
	memo, err := serverlib.MODEL_PROVIDER.GetMemoByResourceID(memoID)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	collector := make([]*types.MemoItem, 0)
	for _, memoItem := range request.MemoItems {
		if memoItem.ResourceID == uuid.Nil {
			//invalid or not set ResourceID
			continue
		}
		memoItem.MemoID = memo.ID
		collector = append(collector, &memoItem)
	}

	if err := serverlib.MODEL_PROVIDER.DeleteMemoItems(collector); err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "delete successful",
	})
}

func GetLinkedMemoHandler(ctx *gin.Context) {
	resourceID := ctx.Param("id")
	memo, err := serverlib.MODEL_PROVIDER.GetMemoByReferencedResourceID(resourceID)
	if err != nil {
		fmt.Printf("%s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"message": "internal server error",
		})
		return
	}
	response := convertToMemoWithTime(memo)

	ctx.JSON(http.StatusOK, gin.H{
		"memo": response,
	})
}

func convertToMemoWithTime(memo *types.Memo) *MemoWithTime {
	result := &MemoWithTime{
		Object:    memo.Object,
		MemoItems: make([]MemoItemWithTime, 0),
	}
	for _, memoItem := range memo.MemoItems {
		result.MemoItems = append(result.MemoItems, MemoItemWithTime{
			MemoItem: &memoItem,
			Created:  memoItem.Model.CreatedAt.Format(time.RFC822),
		})
	}
	return result
}
