require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
native_sdk = JSON.parse(File.read(File.join(__dir__, '..', 'native-sdk.json')))
native_major_minor = native_sdk['version'].split('.').first(2).join('.')

Pod::Spec.new do |s|
  s.name = 'ReactNativeAppy'
  s.version = package['version']
  s.summary = package['description']
  s.description = package['description']
  s.license = { :type => package['license'], :file => '../LICENSE' }
  s.author = package['author']
  s.homepage = package['homepage']
  s.platforms = { :ios => '15.1' }
  s.swift_version = '5.9'
  s.source = { :git => package['repository']['url'].sub(/^git\+/, ''), :tag => s.version.to_s }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'AppySDK', "~> #{native_major_minor}"

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,mm,swift}'
end
