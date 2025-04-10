package com.office.tuja.coin;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class PriceStreamController {

	private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

	@GetMapping("/price-stream")
	public SseEmitter stream() {
		SseEmitter emitter = new SseEmitter(60 * 60 * 1000L); // 1시간 유지
		emitters.add(emitter);

		emitter.onCompletion(() -> emitters.remove(emitter));
		emitter.onTimeout(() -> emitters.remove(emitter));
		emitter.onError(e -> emitters.remove(emitter));

		return emitter;
	}

	public void sendPrice(String code, double price) {
		Map<String, Object> payload = new HashMap<>();
		payload.put("code", code);
		payload.put("price", price);

		for (SseEmitter emitter : emitters) {
			try {
				emitter.send(payload);
			} catch (IOException e) {
				emitters.remove(emitter);
			}
		}
	}
}
