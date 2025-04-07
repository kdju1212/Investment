package com.office.tuja;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class InvestmentWebsocketApplication {

	public static void main(String[] args) {
		SpringApplication.run(InvestmentWebsocketApplication.class, args);
	}

}
