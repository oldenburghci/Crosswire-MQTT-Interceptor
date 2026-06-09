package db

import (
	"fmt"
	"github.com/google/uuid"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
	"testing"
)

var modelProvider *PostgresModelProvider

func init() {
	provider, err := NewPostgresModelProvider(gateway.GetDatabaseEnvironment(gateway.NewGatewayConfig()))
	if err != nil {
		panic(err)
	}
	modelProvider = provider
}

func TestPostgresModelProvider_CreateMemo(t *testing.T) {
	parsedUUID, err := uuid.Parse("a18f628a-255e-45ff-8576-64c4a4524658")
	if err != nil {
		t.Error(err)
	}

	m0 := types.Memo{
		Object: types.Object{
			OwnerID: 2,
			Shared:  false,
		},
		MemoSharedWith: make([]types.MemoSharedWith, 0),
		MemoItems: []types.MemoItem{
			{
				OwnerID:     2,
				Description: "This is the first item and it is checked",
				Checked:     true,
			},
			{
				OwnerID:     2,
				Description: "This is the second item and it is not checked",
				Checked:     false,
			},
			{
				OwnerID:     2,
				Description: "This is the third item and it is not checked",
				Checked:     false,
			},
		},
		ObjectReference: []types.ObjectReference{
			{
				ResourceID: parsedUUID,
			},
		},
	}
	err = modelProvider.CreateMemo(&m0)
	if err != nil {
		t.Error(err)
	}
}

func TestPostgresModelProvider_GetMemos(t *testing.T) {
	memos, err := modelProvider.GetMemosForUser(2)
	if err != nil {
		t.Error(err)
	}

	if len(memos) == 0 {
		t.Error("Expected at least one memo")
	}

	if len(memos[0].MemoItems) != 3 {
		fmt.Println(len(memos[0].MemoItems))
		t.Error("Expected 3 memo items")
	}

	if len(memos[0].ObjectReference) != 1 {
		t.Error("Expected 1 object reference")
	}

	for i, memo := range memos {
		fmt.Printf("[%d] - %+v\n---\n", i, memo)
	}
}

func TestPostgresModelProvider_DeleteMemo(t *testing.T) {
	memos, err := modelProvider.GetMemosForUser(2)
	if err != nil {
		t.Error(err)
	}

	for _, m := range memos {
		err = modelProvider.DeleteMemo(m)
	}
	if err != nil {
		t.Error(err)
	}
	memos, err = modelProvider.GetMemosForUser(2)
	if err != nil {
		t.Error(err)
	}
	if len(memos) != 0 {
		t.Error("Expected 0 memo")
	}
}

func TestPostgresModelProvider_CreateSharedMemos(t *testing.T) {
	m0 := types.Memo{
		Object: types.Object{
			OwnerID: 2,
			Shared:  false,
		},
		MemoSharedWith: []types.MemoSharedWith{
			{
				UserID: 3,
			},
		},
		MemoItems: make([]types.MemoItem, 0),
	}
	m1 := types.Memo{
		Object: types.Object{
			OwnerID: 3,
			Shared:  true,
		},
		MemoSharedWith: []types.MemoSharedWith{
			{
				UserID: 2,
			},
		},
		MemoItems: make([]types.MemoItem, 0),
	}
	err := modelProvider.CreateMemo(&m0)
	if err != nil {
		t.Error(err)
	}
	err = modelProvider.CreateMemo(&m1)
	if err != nil {
		t.Error(err)
	}
}

func TestPostgresModelProvider_GetSharedMemos(t *testing.T) {
	memosForUser2, _ := modelProvider.GetMemosForUser(2)
	memosForUser3, _ := modelProvider.GetMemosForUser(3)
	if len(memosForUser2) == 0 || len(memosForUser3) == 0 {
		t.Error("Expected more than 1 memo per user")
	}

	sharedMemosForUser2, err := modelProvider.GetSharedMemosForUser(2)
	if err != nil {
		t.Error(err)
	}
	sharedMemosForUser3, err := modelProvider.GetSharedMemosForUser(3)
	if err != nil {
		t.Error(err)
	}

	if len(sharedMemosForUser2) == 0 || len(sharedMemosForUser3) == 0 {
		t.Error("Expected more than 1 shared memo per user")
	}
}

func TestPostgresModelProvider_GetMemoAccessParametersByResourceId(t *testing.T) {
	memosForUser3, _ := modelProvider.GetMemosForUser(3)
	for _, memo := range memosForUser3 {
		isShared, owner_id, shared_with, err := modelProvider.GetMemoAccessParametersByResourceId(memo.ResourceID.String())
		if err != nil {
			t.Error(err)
		}
		if owner_id != 3 {
			t.Error("Expected memo owner incorrect")
		}
		fmt.Printf("%t, %d, %+v\n---\n", isShared, owner_id, shared_with)
	}
}

func TestPostgresModelProvider_UpdateMemo(t *testing.T) {
	memos, _ := modelProvider.GetMemosForUser(2)
	for _, m := range memos {
		fmt.Printf("Update memo: %+v\n---\n", m)
		m.Shared = true
		m.MemoSharedWith = append(m.MemoSharedWith, types.MemoSharedWith{
			UserID: 3,
			MemoID: m.ID,
		})
		pre := len(m.MemoSharedWith)
		err := modelProvider.UpdateMemo(m)
		if err != nil {
			t.Error(err)
		}
		m0, err := modelProvider.GetMemoByResourceID(m.ResourceID.String())
		if err != nil {
			t.Error(err)
		}
		if len(m0.MemoSharedWith) != pre {
			t.Error("Expected len for memo shared incorrect")
		}
		if m.Shared != m0.Shared == true {
			t.Error("Expected m0.Shared to be equal to m.Shared and true")
		}
	}
}

func TestPostgresModelProvider_DeleteSharedMemos(t *testing.T) {
	memosForUser2, _ := modelProvider.GetMemosForUser(2)
	memosForUser3, _ := modelProvider.GetMemosForUser(3)

	for _, memo := range append(memosForUser2, memosForUser3...) {
		err := modelProvider.DeleteMemo(memo)
		if err != nil {
			t.Error(err)
		}
	}

	memosForUser2, _ = modelProvider.GetMemosForUser(2)
	memosForUser3, _ = modelProvider.GetMemosForUser(3)

	if len(memosForUser2) != 0 || len(memosForUser3) != 0 {
		t.Error("Expected 0 memo per user")
	}
}

//func TestPostgresModelProvider_CreateMemo2(t *testing.T) {
//	resourceID, err := uuid.Parse("a18f628a-255e-45ff-8576-64c4a4524658")
//	m0 := types.Memo{
//		Object: types.Object{
//			OwnerID: 2,
//			Shared:  true,
//		},
//		MemoSharedWith: []types.MemoSharedWith{
//			{
//				UserID: 3,
//			},
//		},
//		MemoItems: []types.MemoItem{
//			{
//				Checked:     false,
//				Description: "Something is described here",
//			},
//			{
//				Checked:     true,
//				Description: "Something is described there",
//			},
//		},
//		ObjectReference: []types.ObjectReference{
//			{
//				ResourceID: resourceID,
//			},
//		},
//	}
//
//	err = modelProvider.CreateMemo(&m0)
//	if err != nil {
//		t.Error(err)
//	}
//}
