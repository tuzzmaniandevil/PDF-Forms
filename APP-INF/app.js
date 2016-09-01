controllerMappings
        .adminController()
        .path("/helloWorld/")
        .enabled(true)
        .defaultView(views.templateView("helloWorld/manageHelloWorld.html"))
        .addMethod("POST", "handleCoffee")
        .build();