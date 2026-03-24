package types

// TODO: refactor the retrieval access parameters into one function
type ApplicationDataPersistenceProvider interface {
	// GetConfigurationsForUser retrieves the owned and shared configurations for this user
	GetConfigurationsForUser(userID uint) ([]*Configuration, error)
	GetConfigurationByFriendlyName(userID uint, friendlyName string) (*Configuration, error)
	GetConfigurationByID(userID, configurationID uint) (*Configuration, error)
	GetConfigurationByResourceID(resourceID string) (*Configuration, error)
	UpdateConfiguration(configuration *Configuration) error
	DeleteConfiguration(configuration *Configuration) error
	CreateConfiguration(configuration *Configuration) error
	DeleteConfigurationSharedWith(configuration *Configuration) error

	DeleteDevicesAndEntries(step *DeviceConfigurationStep) error
	DeleteSuppressedAndInterceptedTopics(step *ErrorConfigurationStep) error

	GetAutomationSubstitution(resourceId string) (*AutomationSubstitution, error)
	UpdateAutomationSubstitution(configuration *AutomationSubstitution) error
	CreateAutomationSubstitution(configuration *AutomationSubstitution) error
	DeleteAutomationSubstitution(configuration *AutomationSubstitution) error

	DeleteAutomationDefinitions(definitions []*AutomationDefinition) error

	GetMemosForUser(userID uint) ([]*Memo, error)
	GetMemoByResourceID(resourceID string) (*Memo, error)
	CreateMemo(memo *Memo) error
	UpdateMemo(memo *Memo) error
	GetMemoItems() ([]*MemoItem, error)
	CreateMemoItem(memoItem *MemoItem, MemoResourceID string) error
	UpdateMemoItem(memoItem *MemoItem) error
	CreateMemoItems(items []*MemoItem) error
	DeleteMemoItems(items []*MemoItem) error
	DeleteMemoSharedWiths(memo *Memo) error
	DeleteMemo(memo *Memo) error
	GetMemoByReferencedResourceID(resourceID string) (*Memo, error)

	GetAccessibleResources(uid uint) ([]string, error)
}
