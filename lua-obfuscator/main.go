package main

import (
	"fmt"
	"io/ioutil"
	"os"
	
	"lua-obfuscator/pkg/obfuscator"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: lua-obfuscator <input.lua> <output.lua>")
		os.Exit(1)
	}
	
	inputFile := os.Args[1]
	outputFile := os.Args[2]
	
	// Read input
	source, err := ioutil.ReadFile(inputFile)
	if err != nil {
		fmt.Printf("Error reading %s: %v\n", inputFile, err)
		os.Exit(1)
	}
	
	// Obfuscate
	cfg := obfuscator.DefaultConfig()
	obf := obfuscator.New(cfg)
	
	result, err := obf.ObfuscateLua(string(source))
	if err != nil {
		fmt.Printf("Obfuscation failed: %v\n", err)
		os.Exit(1)
	}
	
	// Write output
	err = ioutil.WriteFile(outputFile, []byte(result), 0644)
	if err != nil {
		fmt.Printf("Error writing %s: %v\n", outputFile, err)
		os.Exit(1)
	}
	
	fmt.Printf("✓ Obfuscated: %s -> %s\n", inputFile, outputFile)
}
