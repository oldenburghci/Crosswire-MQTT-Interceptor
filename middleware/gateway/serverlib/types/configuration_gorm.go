package types

import (
	"gorm.io/gorm"
)

// BeforeDelete Cascade for soft delete, see https://github.com/go-gorm/gorm/issues/6357#issuecomment-1566946772
func (c *Configuration) BeforeDelete(tx *gorm.DB) error {
	if err := tx.Delete(&c.DeviceConfigurationStep).Error; err != nil {
		return err
	}
	if err := tx.Delete(&c.RulesConfigurationStep).Error; err != nil {
		return err
	}
	if err := tx.Delete(&c.ErrorConfigurationStep).Error; err != nil {
		return err
	}
	for _, sharedWith := range c.ConfigurationSharedWith {
		if err := tx.Delete(&sharedWith).Error; err != nil {
			return err
		}
	}

	return nil
}

func (step *RuleConfigurationStep) BeforeDelete(tx *gorm.DB) error {
	for _, sub := range step.Substitutions {
		if err := tx.Delete(&sub).Error; err != nil {
			return err
		}
	}
	return nil
}

func (step *ErrorConfigurationStep) BeforeDelete(tx *gorm.DB) error {
	for _, suppressed := range step.SuppressedTopics {
		if err := tx.Delete(&suppressed).Error; err != nil {
			return err
		}
	}
	for _, intercepted := range step.InterceptedTopics {
		if err := tx.Delete(&intercepted).Error; err != nil {
			return err
		}
	}
	return nil
}

func (step *DeviceConfigurationStep) BeforeDelete(tx *gorm.DB) error {
	for _, entity := range step.Entities {
		if err := tx.Delete(&entity).Error; err != nil {
			return err
		}
	}
	return nil
}

func (device *Device) BeforeDelete(tx *gorm.DB) error {
	for _, entity := range device.Entities {
		if err := tx.Delete(&entity).Error; err != nil {
			return err
		}
	}
	return nil
}

func (substitution *AutomationSubstitution) BeforeDelete(tx *gorm.DB) error {
	if err := tx.Unscoped().Delete(&substitution.Definitions); err != nil {
		return err.Error
	}
	return nil
}

func (definition *AutomationDefinition) BeforeDelete(tx *gorm.DB) error {
	for _, trigger := range definition.Triggers {
		if err := tx.Unscoped().Delete(&trigger).Error; err != nil {
			return err
		}
	}
	for _, condition := range definition.Conditions {
		if err := tx.Unscoped().Delete(&condition).Error; err != nil {
			return err
		}
	}
	for _, action := range definition.Actions {
		if err := tx.Unscoped().Delete(&action).Error; err != nil {
			return err
		}
	}
	return nil
}
