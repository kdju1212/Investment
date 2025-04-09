package com.office.tuja;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

	@GetMapping("/")
	public String index() {
		return "index"; 
	}

	@GetMapping("/coin")
	public String coin() {
		return "coin";
	}

	@GetMapping("/stock")
	public String stock() {
		return "stock";
	}

	@GetMapping("/gold")
	public String gold() {
		return "gold";
	}

}
