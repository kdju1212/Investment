package com.office.tuja.coin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
public class PriceStreamController {

	private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

	@GetMapping("/price-stream")
	public SseEmitter stream() {
		SseEmitter emitter = new SseEmitter();
		emitters.add(emitter);

		emitter.onCompletion(() -> emitters.remove(emitter));
		emitter.onTimeout(() -> emitters.remove(emitter));

		return emitter;
	}

	public void sendPrice(String price) {
		for (SseEmitter emitter : emitters) {
			try {
				emitter.send(price);
			} catch (IOException e) {
				emitters.remove(emitter);
			}
		}
	}
}
