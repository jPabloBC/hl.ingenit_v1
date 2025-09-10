UPDATE app_hl.hl_user_subscriptions SET business_id = (SELECT id FROM app_hl.hl_business WHERE user_id = hl_user_subscriptions.user_id) WHERE business_id IS NULL;
