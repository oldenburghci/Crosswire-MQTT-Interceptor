package types

import (
	"gorm.io/gorm"
)

// BeforeDelete Cascade for soft delete, see https://github.com/go-gorm/gorm/issues/6357#issuecomment-1566946772
func (m *Memo) BeforeDelete(tx *gorm.DB) error {
	for _, item := range m.MemoItems {
		if err := tx.Delete(&item).Error; err != nil {
			return err
		}
	}
	for _, sharedWith := range m.MemoSharedWith {
		if err := tx.Delete(&sharedWith).Error; err != nil {
			return err
		}
	}
	for _, reference := range m.ObjectReference {
		if err := tx.Delete(&reference).Error; err != nil {
			return err
		}
	}

	return nil
}
