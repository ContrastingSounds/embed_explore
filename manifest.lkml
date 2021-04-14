project_name: "ef_explore"

application: ef-explore {
  label: "Embed Explore"
  # file: "dist/data-portal.js"
  url: "http://127.0.0.1:5500/dist/data-portal.js"

  entitlements: {
    use_embeds: yes
    use_form_submit: yes
    core_api_methods: [
      "me",
      "all_user_attributes",
      "user_attribute_user_values",
      "create_user_attribute",
      "update_user_attribute",
      "user_roles",
      "all_boards",
      "board",
      "query_for_slug",
      "run_inline_query",
    ]
  }
}

constant: CONNECTION_NAME {
  value: "choose-connection"
  export: override_required
}