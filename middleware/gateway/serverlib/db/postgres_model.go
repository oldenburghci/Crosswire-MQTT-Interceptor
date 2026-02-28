package db

import (
	"errors"
	"fmt"
	"github.com/google/uuid"
	"gitlab.offis.de/mwozniak/smart-hotel-lab/middleware/gateway/serverlib/types"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type PostgresModelProvider struct {
	dbConnection *gorm.DB
	config       map[string]string
}

func NewPostgresModelProvider(config map[string]string) (*PostgresModelProvider, error) {
	provider := &PostgresModelProvider{}
	provider.config = config
	err := provider.createDatabase()
	if err != nil {
		return nil, err
	}
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=middleware-data port=%s sslmode=disable TimeZone=Europe/Berlin",
		provider.config["DB_HOST"],
		provider.config["DB_USER"],
		provider.config["DB_PASSWD"],
		provider.config["DB_PORT"],
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	provider.dbConnection = db
	//should not cause trouble if executed on every startup
	if err := provider.InitializeDatabaseExtension(); err != nil {
		return nil, err
	}
	err = provider.dbConnection.AutoMigrate(
		&types.Configuration{},
		&types.Entity{},
		//&types.Device{},
		&types.DeviceConfigurationStep{},
		//&types.EntityConfiguration{},

		//&types.RuleSubstitution{},
		&types.Trigger{},
		&types.Condition{},
		&types.Action{},
		&types.AutomationDefinition{},
		&types.AutomationSubstitution{},
		&types.RuleConfigurationStep{},

		&types.ErrorConfigurationStep{},
		&types.MQTTSuppressedTopicWrapper{},
		&types.MQTTInterceptedTopicWrapper{},

		&types.ConfigurationSharedWith{},

		&types.Memo{},
		&types.MemoItem{},
		&types.MemoSharedWith{},
		&types.ObjectReference{},
	)
	if err != nil {
		return nil, err
	}

	return provider, nil
}

func (p *PostgresModelProvider) createDatabase() error {
	//initial check
	db, err := gorm.Open(
		postgres.Open(
			fmt.Sprintf(
				"host=%s user=%s password=%s dbname=middleware-data port=%s sslmode=disable TimeZone=Europe/Berlin",
				p.config["DB_HOST"],
				p.config["DB_USER"],
				p.config["DB_PASSWD"],
				p.config["DB_PORT"],
			),
		),
		&gorm.Config{},
	)
	if err == nil {
		fmt.Printf("database middleware-data already exists.\n")
		return nil
	}

	fmt.Printf("database middlware-data does not exist, create it now.\n")
	db, err = gorm.Open(
		postgres.Open(
			fmt.Sprintf(
				"host=%s user=%s password=%s dbname=postgres port=%s sslmode=disable TimeZone=Europe/Berlin",
				p.config["DB_HOST"],
				p.config["DB_USER"],
				p.config["DB_PASSWD"],
				p.config["DB_PORT"],
			),
		),
		&gorm.Config{},
	)
	if err != nil {
		return err
	}
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	//TODO: database name from env
	createCmd := fmt.Sprintf("CREATE DATABASE \"%s\"", "middleware-data")
	err = db.Exec(createCmd).Error
	if err != nil {
		return err
	}

	err = sqlDB.Close()
	if err != nil {
		return err
	}

	return nil
}

//Memo related

func (p *PostgresModelProvider) GetMemosForUser(userID uint) ([]*types.Memo, error) {
	memos := make([]*types.Memo, 0)

	result := p.dbConnection.
		Preload("MemoItems").
		Preload("MemoSharedWith").
		Preload("ObjectReference").
		Find(&memos, "owner_id = ?", userID)
	if result.Error != nil {
		return nil, result.Error
	}

	return memos, nil
}

func (p *PostgresModelProvider) GetMemoByResourceID(resourceId string) (*types.Memo, error) {
	memo := &types.Memo{}
	result := p.dbConnection.
		Preload("MemoItems", func(db *gorm.DB) *gorm.DB {
			// ordered by
			return db.Order("created_at DESC")
		}).
		Preload("MemoSharedWith").
		Preload("ObjectReference").
		First(&memo, "resource_id = ?", resourceId)
	if result.Error != nil {
		return nil, result.Error
	}
	return memo, nil
}

func (p *PostgresModelProvider) CreateMemo(memo *types.Memo) error {
	result := p.dbConnection.Create(memo)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (p *PostgresModelProvider) CreateMemoItem(memoItem *types.MemoItem, memoResourceID string) error {
	//TODO implement me
	panic("implement me")
}

func (p *PostgresModelProvider) GetMemoItems() ([]*types.MemoItem, error) {
	//
	panic("implement me")
}

func (p *PostgresModelProvider) DeleteMemo(memo *types.Memo) error {
	result := p.dbConnection.Delete(memo)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

//configurations

func (p *PostgresModelProvider) GetConfigurationsForUser(userID uint) ([]*types.Configuration, error) {
	configurations := make([]*types.Configuration, 0)
	result :=
		p.dbConnection.
			Preload("DeviceConfigurationStep").Preload("DeviceConfigurationStep.Devices").
			Preload("DeviceConfigurationStep.Devices.Entities").
			Preload("RulesConfigurationStep").Preload("RulesConfigurationStep.Substitutions").
			Preload("ErrorConfigurationStep").Preload("ErrorConfigurationStep.SuppressedTopics").
			Preload("ErrorConfigurationStep.InterceptedTopics").
			Preload("ConfigurationSharedWith").
			Find(&configurations, "owner_id = ?", userID)
	if result.Error != nil {
		return nil, result.Error
	}
	return configurations, nil
}

func (p *PostgresModelProvider) GetConfigurationByFriendlyName(userID uint, friendlyName string) (*types.Configuration, error) {
	configuration := types.Configuration{}
	result :=
		p.dbConnection.
			Preload("DeviceConfigurationStep").Preload("DeviceConfigurationStep.Devices").
			Preload("DeviceConfigurationStep.Devices.Entities").
			Preload("RulesConfigurationStep").
			Preload("RulesConfigurationStep.Substitutions").
			Preload("RulesConfigurationStep.Substitutions.Definitions").
			Preload("RulesConfigurationStep.Substitutions.Definitions.Triggers").
			Preload("RulesConfigurationStep.Substitutions.Definitions.Conditions").
			Preload("RulesConfigurationStep.Substitutions.Definitions.Actions").
			Preload("ErrorConfigurationStep").Preload("ErrorConfigurationStep.SuppressedTopics").
			Preload("ErrorConfigurationStep.InterceptedTopics").
			Preload("ConfigurationSharedWith").
			First(&configuration, "owner_id = ? AND name = ? ", userID, friendlyName)
	if result.Error != nil {
		return nil, result.Error
	}
	if configuration.Name != friendlyName {
		return nil, errors.New("configuration not found")
	}
	return &configuration, nil
}

func (p *PostgresModelProvider) GetConfigurationByID(userID uint, configurationID uint) (*types.Configuration, error) {
	configuration := types.Configuration{}
	result :=
		p.dbConnection.
			Preload("DeviceConfigurationStep").Preload("DeviceConfigurationStep.Devices").
			Preload("DeviceConfigurationStep.Devices.Entities").
			Preload("RulesConfigurationStep").
			Preload("RulesConfigurationStep.Substitutions").
			Preload("RulesConfigurationStep.Substitutions.Definitions").
			Preload("RulesConfigurationStep.Substitutions.Definitions.Triggers").
			Preload("RulesConfigurationStep.Substitutions.Definitions.Conditions").
			Preload("RulesConfigurationStep.Substitutions.Definitions.Actions").
			Preload("ErrorConfigurationStep").Preload("ErrorConfigurationStep.SuppressedTopics").
			Preload("ErrorConfigurationStep.InterceptedTopics").
			Preload("ConfigurationSharedWith").
			First(&configuration, "owner_id = ? AND id = ? ", userID, configurationID)
	if result.Error != nil {
		return nil, result.Error
	}
	if configuration.ID != configurationID {
		return nil, errors.New("configuration not found")
	}
	return &configuration, nil
}

func (p *PostgresModelProvider) GetConfigurationByResourceID(resourceID string) (*types.Configuration, error) {
	configuration := types.Configuration{}
	result :=
		p.dbConnection.
			Preload("DeviceConfigurationStep").Preload("DeviceConfigurationStep.Entities").
			//Preload("DeviceConfigurationStep.Entities").
			Preload("RulesConfigurationStep").
			Preload("RulesConfigurationStep.Substitutions").
			Preload("RulesConfigurationStep.Substitutions.Definitions").
			Preload("RulesConfigurationStep.Substitutions.Definitions.Triggers").
			Preload("RulesConfigurationStep.Substitutions.Definitions.Conditions").
			Preload("RulesConfigurationStep.Substitutions.Definitions.Actions").
			Preload("ErrorConfigurationStep").Preload("ErrorConfigurationStep.SuppressedTopics").
			Preload("ErrorConfigurationStep.InterceptedTopics").
			Preload("ConfigurationSharedWith").
			First(&configuration, "resource_id = ? ", resourceID)
	if result.Error != nil {
		return nil, result.Error
	}
	if configuration.ResourceID.String() != resourceID {
		return nil, errors.New("configuration not found")
	}
	return &configuration, nil
}

func (p *PostgresModelProvider) UpdateConfiguration(configuration *types.Configuration) error {
	result := p.dbConnection.Session(&gorm.Session{FullSaveAssociations: true}).Save(&configuration)
	if result.Error != nil {
		return result.Error
	}
	if result.Statement.Changed() {
		return errors.New("no entry has changed by this update operation")
	}
	return nil
}

func (p *PostgresModelProvider) DeleteConfiguration(configuration *types.Configuration) error {
	result := p.dbConnection.Delete(configuration)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("no rows were affected by this delete operation")
	}
	return nil
}

func (p *PostgresModelProvider) CreateConfiguration(configuration *types.Configuration) error {
	result := p.dbConnection.Create(&configuration)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("configuration could not be created")
	}
	return nil
}

func (p *PostgresModelProvider) DeleteConfigurationSharedWith(configuration *types.Configuration) error {
	collector := make([]uint, 0)
	for _, sharedWith := range configuration.ConfigurationSharedWith {
		collector = append(collector, sharedWith.UserID)
	}
	result := p.dbConnection.Where("user_id in ?", collector).Delete(configuration.ConfigurationSharedWith)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (p *PostgresModelProvider) UpdateMemo(memo *types.Memo) error {
	result := p.dbConnection.Session(&gorm.Session{FullSaveAssociations: true}).Save(&memo)
	if result.Error != nil {
		return result.Error
	}
	if result.Statement.Changed() {
		return errors.New("no entry has changed by this update operation")
	}
	return nil
}

func (p *PostgresModelProvider) UpdateMemoItem(memoItem *types.MemoItem) error {
	query := p.dbConnection.Session(&gorm.Session{FullSaveAssociations: true}).Save(&memoItem)
	if query.Error != nil {
		return query.Error
	}
	if query.Statement.Changed() {
		return errors.New("no entry has changed by this update operation")
	}
	return nil
}

func (p *PostgresModelProvider) CreateMemoItems(items []*types.MemoItem) error {
	query := p.dbConnection.Create(&items)
	if query.Error != nil {
		return query.Error
	}
	//if query.Statement.Changed() {
	//	return errors.New("no entry has changed by this update operation")
	//}
	return nil
}

func (p *PostgresModelProvider) DeleteMemoItems(items []*types.MemoItem) error {
	collector := make([]string, 0)
	for _, item := range items {
		collector = append(collector, item.ResourceID.String())
	}
	query := p.dbConnection.Unscoped().Delete(&items, "resource_id IN ? AND deleted_at is NULL", collector)
	if query.Error != nil {
		return query.Error
	}
	return nil
}

func (p *PostgresModelProvider) DeleteMemoSharedWiths(memo *types.Memo) error {
	collector := make([]uint, 0)
	for _, sharedWith := range memo.MemoSharedWith {
		collector = append(collector, sharedWith.UserID)
	}
	result := p.dbConnection.Where("user_id in ?", collector).Delete(memo.MemoSharedWith)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (p *PostgresModelProvider) GetMemoByReferencedResourceID(resourceID string) (*types.Memo, error) {
	memo := types.Memo{}
	parse, err := uuid.Parse(resourceID)
	if err != nil {
		return nil, err
	}
	reference := types.ObjectReference{
		ResourceID: parse,
	}
	// this construct appears more complicated as it seems... Due to a misfortune modelling error (or something alike)
	// it is not possible to preload all associated data structures for memo if we like to begin from the object references
	// Therefore the query is split into two, where we first look for an object reference with the given resourceID
	//(from a configuration) and then get the memo for it.
	// Might be worth to simplify in a future iteration.
	query := p.dbConnection.
		//Debug().
		Find(&reference, "resource_id = ? ", resourceID)
	if query.Error != nil {
		return nil, query.Error
	}

	query = p.dbConnection.
		//Debug().
		Preload("MemoSharedWith").
		Preload("MemoItems", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Find(&memo, "id = ? ", reference.ReferenceID)
	//fmt.Printf("memo=%+v\n", memo)
	if query.Error != nil {
		return nil, query.Error
	}
	return &memo, nil
}

func (p *PostgresModelProvider) DeleteDevicesAndEntries(step *types.DeviceConfigurationStep) error {

	entitiesIDCollector := make([]uint, 0)
	for _, entity := range step.Entities {
		entitiesIDCollector = append(entitiesIDCollector, entity.Model.ID)
		query := p.dbConnection.Unscoped().Delete(&entity, "id IN (?) ", entitiesIDCollector)
		if query.Error != nil {
			return query.Error
		}
	}

	return nil
}

func (p *PostgresModelProvider) DeleteSuppressedAndInterceptedTopics(step *types.ErrorConfigurationStep) error {
	suppressedIDsCollector := make([]uint, 0)
	interceptedIDsCollector := make([]uint, 0)

	for _, suppressedTopic := range step.SuppressedTopics {
		suppressedIDsCollector = append(suppressedIDsCollector, suppressedTopic.Model.ID)
	}
	for _, interceptedTopic := range step.InterceptedTopics {
		interceptedIDsCollector = append(interceptedIDsCollector, interceptedTopic.Model.ID)
	}
	query := p.dbConnection.Unscoped().Delete(&step.SuppressedTopics, "id IN (?) ", suppressedIDsCollector)
	if query.Error != nil {
		return query.Error
	}
	query = p.dbConnection.Unscoped().Delete(&step.InterceptedTopics, "id IN (?)", interceptedIDsCollector)
	if query.Error != nil {
		return query.Error
	}
	return nil
}

// GetAccessibleResources retrieves all resources guids this user has access to (shared or owned).
func (c *PostgresModelProvider) GetAccessibleResources(uid uint) ([]string, error) {
	queryCollector := make([]map[string]interface{}, 0)
	// memos
	query := c.dbConnection.Raw(
		"SELECT DISTINCT m.resource_id FROM memos m "+
			"FULL OUTER JOIN memo_shared_withs msw "+
			"ON m.id = msw.memo_id "+
			"WHERE m.owner_id = ? AND m.deleted_at is NULL OR (m.shared = true AND msw.user_id = ? AND msw.deleted_at is NULL AND m.deleted_at is NULL)",
		uid, uid,
	).Scan(&queryCollector)

	if query.Error != nil {
		return nil, query.Error
	}
	result := make([]string, 0)
	for _, r := range queryCollector {
		result = append(result, r["resource_id"].(string))
	}

	queryCollector = make([]map[string]interface{}, 0)
	// configurations
	query = c.dbConnection.Raw(
		"SELECT DISTINCT c.resource_id FROM configurations c "+
			"FULL OUTER JOIN configuration_shared_withs csw ON c.id = csw.configuration_id "+
			"WHERE c.owner_id = ? AND c.deleted_at IS NULL OR (shared = true AND user_id = ? AND c.deleted_at is NULL AND csw.deleted_at is NULL)",
		uid, uid,
	).Scan(&queryCollector)
	if query.Error != nil {
		return nil, query.Error
	}
	for _, r := range queryCollector {
		result = append(result, r["resource_id"].(string))
	}

	return result, nil
}

func (p *PostgresModelProvider) GetAutomationSubstitution(resourceId string) (*types.AutomationSubstitution, error) {
	result := &types.AutomationSubstitution{}
	query := p.dbConnection.
		//Debug().
		Preload("Definitions").
		Preload("Definitions.Triggers").
		Preload("Definitions.Conditions").
		Preload("Definitions.Actions").
		First(result, "resource_id = ? ", resourceId)
	if query.Error != nil {
		return nil, query.Error
	}
	if query.RowsAffected == 0 {
		return nil, errors.New("no automation substitution found")
	}
	return result, nil
}

func (p *PostgresModelProvider) UpdateAutomationSubstitution(substitution *types.AutomationSubstitution) error {
	result := p.dbConnection.Session(&gorm.Session{FullSaveAssociations: true}).Save(&substitution)
	if result.Error != nil {
		return result.Error
	}
	return nil
}

func (p *PostgresModelProvider) CreateAutomationSubstitution(substitution *types.AutomationSubstitution) error {
	query := p.dbConnection.Create(&substitution)
	if query.Error != nil {
		return query.Error
	}
	if query.RowsAffected == 0 {
		return errors.New("automation substitution could not be created")
	}
	return nil
}

func (p *PostgresModelProvider) DeleteAutomationSubstitution(substitution *types.AutomationSubstitution) error {
	query := p.dbConnection.Unscoped().Delete(&substitution)
	if query.Error != nil {
		return query.Error
	}
	if query.RowsAffected == 0 {
		return errors.New("Automation substitution could not be deleted. Does it exist?")
	}
	return nil
}

func (p *PostgresModelProvider) DeleteAutomationDefinitions(definitions []*types.AutomationDefinition) error {
	collector := make([]uint, 0)
	for _, definition := range definitions {
		collector = append(collector, definition.ID)
	}
	query := p.dbConnection.Unscoped().Delete(definitions, "id IN (?)", collector)
	if query.Error != nil {
		return query.Error
	}
	//if query.RowsAffected == 0 {
	//	return errors.New("automation definitions could not be deleted. Does they exist?")
	//}
	return nil
}

func (p *PostgresModelProvider) InitializeDatabaseExtension() error {
	fmt.Println("Initializing database extension now")
	result := p.dbConnection.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
	if result.Error != nil {
		return result.Error
	}
	return nil
}
