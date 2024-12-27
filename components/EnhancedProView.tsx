                    <div className="space-y-2">
                      {[
                        t('pro.features.proFeaturesList.unlimitedCards'),
                        t('pro.features.proFeaturesList.fullExtraction'),
                        t('pro.features.proFeaturesList.subIndustries'),
                        t('pro.features.proFeaturesList.advancedFiltering'),
                        t('pro.features.proFeaturesList.multipleDevices'),
                        t('pro.features.proFeaturesList.exportFormats'),
                        t('pro.features.proFeaturesList.prioritySupport'),
                        t('pro.features.proFeaturesList.fullTextSearch'),
                        t('pro.features.proFeaturesList.autoCharts'),
                        t('pro.features.proFeaturesList.batchUpload'),
                        t('pro.features.proFeaturesList.teamCollaboration'),
                        t('pro.features.proFeaturesList.remindersAlerts'),
                        t('pro.features.proFeaturesList.aiUpdates')
                      ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      {t('pro.buttons.upgradePro')}
                    </Button> 