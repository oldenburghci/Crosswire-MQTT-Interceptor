package handler

import (
	"github.com/google/uuid"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
)

// those are return types for handlers, don't use for internal processing
type ShortConfigResponse struct {
	Key          uuid.UUID `json:"key"`
	FriendlyName string    `json:"friendlyName"`
}

type GetAllConfigsResponse struct {
	Configurations []ShortConfigResponse `json:"configs"`
}

type GetAllMemosResponse struct {
	Memos []*types.Memo `json:"memos"`
}

type EnforcerSubject struct {
	UserID uint
}

type EnforcerObject struct {
	SharedWith uint
	Shared     bool
	OwnerID    uint
}

type ShareConfigurationRequest struct {
	Shared          bool     `json:"shared"`
	SharedWithUsers []string `json:"sharedWithUsers"`
}

type GeneralMemoItemsRequest struct {
	MemoItems []types.MemoItem `json:"items" binding:"required"`
}

type ShareMemoRequest struct {
	Shared          bool     `json:"shared" binding:"required"`
	SharedWithUsers []string `json:"sharedWithUsers" binding:"required"`
}

type MemoItemWithTime struct {
	*types.MemoItem
	Created string `json:"createdAt"`
}
type MemoWithTime struct {
	types.Object
	MemoItems []MemoItemWithTime `json:"items"`
}
